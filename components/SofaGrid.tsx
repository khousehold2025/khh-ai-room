import sofas from "@/data/sofas.json";
import SofaCard from "./SofaCard";

type Props = {
  selected: string;
  onSelect: (id: string) => void;
};

export default function SofaGrid({
  selected,
  onSelect,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

   {sofas
  .filter((sofa) => sofa.active !== false)
  .map((sofa) => (
        <SofaCard
          key={sofa.id}
          id={sofa.id}
          name={sofa.name}
          image={sofa.image}
          selected={selected === sofa.id}
          onClick={() => onSelect(sofa.id)}
        />
      ))}

    </div>
  );
}