import { minesGame } from "@/components/mines/minesConfig";
import MinesComponent from "@/components/mines/Mines";

export async function generateMetadata() {
  return {
    title: minesGame.title,
    description: minesGame.description,
  };
}

const MinesPage: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-row mb-2 sm:mb-4">
        <h1 className="text-3xl font-semibold mr-2">
          {minesGame.title}
        </h1>
      </div>
      <MinesComponent game={minesGame} />
    </div>
  );
};

export default MinesPage;