/* eslint-disable quotes */
import {
  sql,
  query,
  convertArrayToPostgresString,
} from '@/platforms/postgres';
import {
  PhotoDb,
  PhotoDbInsert,
  translatePhotoId,
  parsePhotoFromDb,
  Photo,
  PhotoDateRange,
} from '@/photo';
import { Tags } from '@/tag';
import {
  ADMIN_SQL_DEBUG_ENABLED,
  AI_TEXT_AUTO_GENERATED_FIELDS,
  AI_TEXT_GENERATION_ENABLED,
} from '@/app/config';
import {
  GetPhotosOptions,
  getLimitAndOffsetFromOptions,
  getOrderByFromOptions,
} from '.';
import { getWheresFromOptions } from '.';
import { FocalLengths } from '@/focal';
import {
  SYNC_QUERY_LIMIT,
  UPDATED_BEFORE_01,
  UPDATED_BEFORE_02,
} from '../sync';
import { MAKE_FUJIFILM } from '@/platforms/fujifilm';
import { Recipes } from '@/recipe';

const createPhotosTable = () =>
  sql`
    CREATE TABLE IF NOT EXISTS photos (
      id VARCHAR(8) PRIMARY KEY,
      url VARCHAR(255) NOT NULL,
      extension VARCHAR(255) NOT NULL,
      aspect_ratio REAL DEFAULT 1.5,
      blur_data TEXT,
      title VARCHAR(255),
      caption TEXT,
      semantic_description TEXT,
      tags VARCHAR(255)[],
      recipe_title VARCHAR(255),
      recipe_data JSONB,
      priority_order REAL,
      taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
      taken_at_naive VARCHAR(255) NOT NULL,
      hidden BOOLEAN,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

// Safe wrapper intended for most queries with JIT migration/table creation
// Catches up to 3 migrations in older installations
const safelyQueryPhotos = async <T>(
  callback: () => Promise<T>,
  queryLabel: string,
  queryOptions?: GetPhotosOptions,
): Promise<T> => {
  let result: T;

  const start = new Date();

  try {
    result = await callback();
  } catch (e: any) {
      // Avoid re-logging errors on initial installation
      if (/relation "photos" does not exist/i.test(e.message)) {
        console.log('Creating photos table ...');
        await createPhotosTable();
        result = await callback();
      }
      if (e.message !== 'The server does not support SSL connections') {
        console.log(`SQL query error (${queryLabel}): ${e.message}`, {
          error: e,
        });
      }
      throw e;

  }

  if (ADMIN_SQL_DEBUG_ENABLED && queryLabel) {
    const time =
      (((new Date()).getTime() - start.getTime()) / 1000).toFixed(2);
    const message = `Debug query: ${queryLabel} (${time} seconds)`;
    if (queryOptions) {
      console.log(message, { options: queryOptions });
    } else {
      console.log(message);
    }
  }

  return result;
};

// Must provide id as 8-character nanoid
export const insertPhoto = (photo: PhotoDbInsert) =>
  safelyQueryPhotos(() => sql`
    INSERT INTO photos (
      id,
      url,
      extension,
      aspect_ratio,
      blur_data,
      title,
      caption,
      semantic_description,
      tags,
      recipe_title,
      recipe_data,
      priority_order,
      hidden,
      taken_at,
      taken_at_naive
    )
    VALUES (
      ${photo.id},
      ${photo.url},
      ${photo.extension},
      ${photo.aspectRatio},
      ${photo.blurData},
      ${photo.title},
      ${photo.caption},
      ${photo.semanticDescription},
      ${convertArrayToPostgresString(photo.tags)},
      ${photo.recipeTitle},
      ${photo.recipeData},
      ${photo.priorityOrder},
      ${photo.hidden},
      ${photo.takenAt},
      ${photo.takenAtNaive}
    )
  `, 'insertPhoto');

export const updatePhoto = (photo: PhotoDbInsert) =>
  safelyQueryPhotos(() => sql`
    UPDATE photos SET
    url=${photo.url},
    extension=${photo.extension},
    aspect_ratio=${photo.aspectRatio},
    blur_data=${photo.blurData},
    title=${photo.title},
    caption=${photo.caption},
    semantic_description=${photo.semanticDescription},
    tags=${convertArrayToPostgresString(photo.tags)},
    recipe_title=${photo.recipeTitle},
    recipe_data=${photo.recipeData},
    priority_order=${photo.priorityOrder || null},
    hidden=${photo.hidden},
    taken_at=${photo.takenAt},
    taken_at_naive=${photo.takenAtNaive},
    updated_at=${(new Date()).toISOString()}
    WHERE id=${photo.id}
  `, 'updatePhoto');

export const deletePhotoTagGlobally = (tag: string) =>
  safelyQueryPhotos(() => sql`
    UPDATE photos
    SET tags=ARRAY_REMOVE(tags, ${tag})
    WHERE ${tag}=ANY(tags)
  `, 'deletePhotoTagGlobally');

export const renamePhotoTagGlobally = (tag: string, updatedTag: string) =>
  safelyQueryPhotos(() => sql`
    UPDATE photos
    SET tags=ARRAY_REPLACE(tags, ${tag}, ${updatedTag})
    WHERE ${tag}=ANY(tags)
  `, 'renamePhotoTagGlobally');

export const addTagsToPhotos = (tags: string[], photoIds: string[]) =>
  safelyQueryPhotos(() => query(`
    UPDATE photos 
    SET tags = (
      SELECT array_agg(DISTINCT elem)
      FROM unnest(
        array_cat(tags, $1)
      ) AS elem
    )
    WHERE id = ANY($2)
  `, [
    convertArrayToPostgresString(tags),
    convertArrayToPostgresString(photoIds),
  ]), 'addTagsToPhotos');

export const deletePhotoRecipeGlobally = (recipe: string) =>
  safelyQueryPhotos(() => sql`
    UPDATE photos
    SET recipe_title=NULL
    WHERE recipe_title=${recipe}
  `, 'deletePhotoRecipeGlobally');

export const renamePhotoRecipeGlobally = (
  recipe: string,
  updatedRecipe: string,
) =>
  safelyQueryPhotos(() => sql`
    UPDATE photos
    SET recipe_title=${updatedRecipe}
    WHERE recipe_title=${recipe}
  `, 'renamePhotoRecipeGlobally');

export const deletePhoto = (id: string) =>
  safelyQueryPhotos(() => sql`
    DELETE FROM photos WHERE id=${id}
  `, 'deletePhoto');

export const getPhotosMostRecentUpdate = async () =>
  safelyQueryPhotos(() => sql`
    SELECT updated_at FROM photos ORDER BY updated_at DESC LIMIT 1
  `.then(({ rows }) => rows[0] ? rows[0].updated_at as Date : undefined)
  , 'getPhotosMostRecentUpdate');

export const getUniqueTags = async () =>
  safelyQueryPhotos(() => sql`
    SELECT DISTINCT unnest(tags) as tag, COUNT(*)
    FROM photos
    WHERE hidden IS NOT TRUE
    GROUP BY tag
    ORDER BY tag ASC
  `.then(({ rows }): Tags => rows.map(({ tag, count }) => ({
      tag: tag as string,
      count: parseInt(count, 10),
    })))
  , 'getUniqueTags');

export const getUniqueTagsHidden = async () =>
  safelyQueryPhotos(() => sql`
    SELECT DISTINCT unnest(tags) as tag, COUNT(*)
    FROM photos
    GROUP BY tag
    ORDER BY tag ASC
  `.then(({ rows }): Tags => rows.map(({ tag, count }) => ({
      tag: tag as string,
      count: parseInt(count, 10),
    })))
  , 'getUniqueTagsHidden');




export const getUniqueRecipes = async () =>
  safelyQueryPhotos(() => sql`
    SELECT DISTINCT recipe_title, COUNT(*)
    FROM photos
    WHERE hidden IS NOT TRUE AND recipe_title IS NOT NULL
    GROUP BY recipe_title
    ORDER BY recipe_title ASC
  `.then(({ rows }): Recipes => rows
      .map(({ recipe_title, count }) => ({
        recipe: recipe_title,
        count: parseInt(count, 10),
      })))
  , 'getUniqueRecipes');

export const getRecipeTitleForData = async (
  data: string | object,
  film: string,
) =>
  // Includes legacy check on pre-stringified JSON
  safelyQueryPhotos(() => sql`
    SELECT recipe_title FROM photos
    WHERE hidden IS NOT TRUE
    AND recipe_data=${typeof data === 'string' ? data : JSON.stringify(data)}
    AND film=${film}
    LIMIT 1
  `
    .then(({ rows }) => rows[0]?.recipe_title as string | undefined)
  , 'getRecipeTitleForData');

export const getPhotosNeedingRecipeTitleCount = async (
  data: string,
  film: string,
  photoIdToExclude?: string,
) =>
  safelyQueryPhotos(() => sql`
    SELECT COUNT(*)
    FROM photos
    WHERE recipe_title IS NULL
    AND recipe_data=${data}
    AND film=${film}
    AND id <> ${photoIdToExclude}
  `.then(({ rows }) => parseInt(rows[0].count, 10))
  , 'getPhotosNeedingRecipeTitleCount');

export const updateAllMatchingRecipeTitles = (
  title: string,
  data: string,
  film: string,
) =>
  safelyQueryPhotos(() => sql`
    UPDATE photos
    SET recipe_title=${title}
    WHERE recipe_title IS NULL
    AND recipe_data=${data}
    AND film=${film}
  `, 'updateAllMatchingRecipeTitles');



export const getUniqueFocalLengths = async () =>
  safelyQueryPhotos(() => sql`
    SELECT DISTINCT focal_length, COUNT(*)
    FROM photos
    WHERE hidden IS NOT TRUE AND focal_length IS NOT NULL
    GROUP BY focal_length
    ORDER BY focal_length ASC
  `.then(({ rows }): FocalLengths => rows
      .map(({ focal_length, count }) => ({
        focal: parseInt(focal_length, 10),
        count: parseInt(count, 10),
      })))
  , 'getUniqueFocalLengths');

export const getPhotos = async (options: GetPhotosOptions = {}) =>
  safelyQueryPhotos(async () => {
    const sql = ['SELECT * FROM photos'];
    const values = [] as (string | number)[];

    const {
      wheres,
      wheresValues,
      lastValuesIndex,
    } = getWheresFromOptions(options);
    
    if (wheres) {
      sql.push(wheres);
      values.push(...wheresValues);
    }

    sql.push(getOrderByFromOptions(options));

    const {
      limitAndOffset,
      limitAndOffsetValues,
    } = getLimitAndOffsetFromOptions(options, lastValuesIndex);

    // LIMIT + OFFSET
    sql.push(limitAndOffset);
    values.push(...limitAndOffsetValues);

    return query(sql.join(' '), values)
      .then(({ rows }) => rows.map(parsePhotoFromDb));
  },
  'getPhotos',
  options,
  );

export const getPhotosNearId = async (
  photoId: string,
  options: GetPhotosOptions,
) =>
  safelyQueryPhotos(async () => {
    const { limit } = options;

    const {
      wheres,
      wheresValues,
      lastValuesIndex,
    } = getWheresFromOptions(options);

    let valuesIndex = lastValuesIndex;

    return query(
      `
        WITH twi AS (
          SELECT *, row_number()
          OVER (${getOrderByFromOptions(options)}) as row_number
          FROM photos
          ${wheres}
        ),
        current AS (SELECT row_number FROM twi WHERE id = $${valuesIndex++})
        SELECT twi.*
        FROM twi, current
        WHERE twi.row_number >= current.row_number - 1
        LIMIT $${valuesIndex++}
      `,
      [...wheresValues, photoId, limit],
    )
      .then(({ rows }) => {
        const photo = rows.find(({ id }) => id === photoId);
        const indexNumber = photo ? parseInt(photo.row_number) : undefined;
        return {
          photos: rows.map(parsePhotoFromDb),
          indexNumber,
        };
      });
  }, `getPhotosNearId: ${photoId}`);    

export const getPhotosMeta = (options: GetPhotosOptions = {}) =>
  safelyQueryPhotos(async () => {
    // eslint-disable-next-line max-len
    let sql = 'SELECT COUNT(*), MIN(taken_at_naive) as start, MAX(taken_at_naive) as end FROM photos';
    const { wheres, wheresValues } = getWheresFromOptions(options);
    if (wheres) { sql += ` ${wheres}`; }
    return query(sql, wheresValues)
      .then(({ rows }) => ({
        count: parseInt(rows[0].count, 10),
        ...rows[0]?.start && rows[0]?.end
          ? { dateRange: rows[0] as PhotoDateRange }
          : undefined,
      }));
  }, 'getPhotosMeta');

export const getPublicPhotoIds = async ({ limit }: { limit?: number }) =>
  safelyQueryPhotos(() => (limit
    ? sql`SELECT id FROM photos WHERE hidden IS NOT TRUE LIMIT ${limit}`
    : sql`SELECT id FROM photos WHERE hidden IS NOT TRUE`)
    .then(({ rows }) => rows.map(({ id }) => id as string))
  , 'getPublicPhotoIds');

export const getPhoto = async (
  id: string,
  includeHidden?: boolean,
): Promise<Photo | undefined> =>
  safelyQueryPhotos(async () => {
    // Check for photo id forwarding and convert short ids to uuids
    const photoId = translatePhotoId(id);
    return (includeHidden
      ? sql<PhotoDb>`SELECT * FROM photos WHERE id=${photoId} LIMIT 1`
      // eslint-disable-next-line max-len
      : sql<PhotoDb>`SELECT * FROM photos WHERE id=${photoId} AND hidden IS NOT TRUE LIMIT 1`)
      .then(({ rows }) => rows.map(parsePhotoFromDb))
      .then(photos => photos.length > 0 ? photos[0] : undefined);
  }, 'getPhoto');

// Sync queries

const outdatedWhereClauses = [
  `updated_at < $1`
];

const outdatedWhereValues = [
  UPDATED_BEFORE_01.toISOString(),
  UPDATED_BEFORE_02.toISOString(),
  MAKE_FUJIFILM,
];

const needsAiTextWhereClauses =
  AI_TEXT_GENERATION_ENABLED
    ? AI_TEXT_AUTO_GENERATED_FIELDS
      .map(field => {
        switch (field) {
        case 'title': return `(title <> '') IS NOT TRUE`;
        case 'caption': return `(caption <> '') IS NOT TRUE`;
        case 'tags': return `(tags IS NULL OR array_length(tags, 1) = 0)`;
        case 'semantic': return `(semantic_description <> '') IS NOT TRUE`;
        }
      })
    : [];

const needsSyncWhereStatement =
  `WHERE ${outdatedWhereClauses.concat(needsAiTextWhereClauses).join(' OR ')}`;

export const getPhotosInNeedOfSync = () => safelyQueryPhotos(
  () => query(`
    SELECT * FROM photos
    ${needsSyncWhereStatement}
    ORDER BY created_at DESC
    LIMIT ${SYNC_QUERY_LIMIT}
  `,
  outdatedWhereValues,
  )
    .then(({ rows }) => rows.map(parsePhotoFromDb)),
  'getPhotosInNeedOfSync',
);

