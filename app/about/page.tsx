import AdminRecipeTable from '@/admin/AdminRecipeTable';
import AppGrid from '@/components/AppGrid';
import { getUniqueRecipes } from '@/photo/db/query';

export default async function AdminRecipesPage() {
  const recipes = await getUniqueRecipes().catch(() => []);

  return (
    <AppGrid
      contentMain={
        <div className="space-y-6">
          <div className="space-y-4">
          <img className="size-100 left-0 mt-4 absolute rounded-xs outline outline-4 outline-offset-[-2px] outline-nntu-blue" src="/favicons/lt.jpg" />
            <div className="w-[589px] left-[425px] absolute justify-start text-black text-xl font-normal font-['Roboto'] leading-loose">Данный проект создан в честь Крюкова Леонарда Тимофеевича — бессменного фотографа и летописца жизни лагеря.<br/><br/>Леонард Тимофеевич на протяжении многих лет был не просто свидетелем, но и хранителем духа лагеря, его традиций и памяти. Его архив — это бесценное культурно-историческое наследие, позволяющее молодым поколениям прикоснуться к прошлому и почувствовать атмосферу дружбы, творчества и единения, царившую в «Ждановце».<br/><br/>Создание данной галереи — наш способ выразить глубокую благодарность и уважение Леонарду Тимофеевичу Крюкову, чья жизнь и профессионализм заслуживают памяти и признательности каждого, кто был связан с лагерем.</div>
          </div>
        </div>}
    />
  );
}
