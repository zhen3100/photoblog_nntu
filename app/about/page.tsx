import AdminRecipeTable from '@/admin/AdminRecipeTable';
import AppGrid from '@/components/AppGrid';
import { getUniqueRecipes } from '@/photo/db/query';

export default async function AdminRecipesPage() {
  const recipes = await getUniqueRecipes().catch(() => []);

  return (
    <AppGrid
      contentMain={

<div className="p-4 md:p-6">
  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
    {/* Изображение - теперь первое в DOM для мобильных */}
    <img 
      className="w-full max-w-[300px] md:max-w-[250px] lg:max-w-[300px] rounded-xs outline outline-4 outline-offset-[-2px] outline-nntu-blue dark:outline-white mx-auto md:mr-6 md:mt-4"
      src="/favicons/lt.jpg" 
      alt="Фото Крюкова Леонарда Тимофеевича"
    />
    
    {/* Текст */}
    <div className="text-black text-base md:text-xl font-normal font-['Roboto'] leading-relaxed md:leading-loose text-justify dark:text-white">
      Данный проект создан в честь Крюкова Леонарда Тимофеевича — бессменного фотографа и летописца жизни лагеря.
      <br/><br/>
      Леонард Тимофеевич на протяжении многих лет был не просто свидетелем, но и хранителем духа лагеря, его традиций и памяти. Его архив — это бесценное культурно-историческое наследие, позволяющее молодым поколениям прикоснуться к прошлому и почувствовать атмосферу дружбы, творчества и единения, царившую в «Ждановце».
      <br/><br/>
      Создание данной галереи — наш способ выразить глубокую благодарность и уважение Леонарду Тимофеевичу Крюкову, чья жизнь и профессионализм заслуживают памяти и признательности каждого, кто был связан с лагерем.
    </div>
  </div>
</div>
      }
    />
  );
}
