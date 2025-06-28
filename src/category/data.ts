import {
  getUniqueRecipes,
  getUniqueTags,
} from '@/photo/db/query';
import {
  SHOW_RECIPES,
  SHOW_TAGS,
} from '@/app/config';
import { sortTagsByCount } from '@/tag';
import { sortCategoriesByCount } from '@/category';
import { sortFocalLengths } from '@/focal';

type CategoryData = Awaited<ReturnType<typeof getDataForCategories>>;

export const NULL_CATEGORY_DATA: CategoryData = {
  tags: [],
  recipes: [],
  films: [],
  focalLengths: [],
};

export const getDataForCategories = () => Promise.all([
  SHOW_TAGS
    ? getUniqueTags()
      .then(sortTagsByCount)
      .catch(() => [])
    : undefined,
  SHOW_RECIPES
    ? getUniqueRecipes()
      .then(sortCategoriesByCount)
      .catch(() => [])
    : undefined,
]).then(([
  tags = [],
  recipes = [],
  films = [],
  focalLengths = [],
]) => ({
   tags, recipes, films, focalLengths,
}));

export const getCountsForCategories = async () => {
  const {
    tags,
    recipes,
  } = await getDataForCategories();

  return {
    tags: tags.reduce((acc, tag) => {
      acc[tag.tag] = tag.count;
      return acc;
    }, {} as Record<string, number>),
    recipes: recipes.reduce((acc, recipe) => {
      acc[recipe.recipe] = recipe.count;
      return acc;
    }, {} as Record<string, number>)
  };
};
