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
    <div className="grid grid-cols-2 gap-4">

      {sofas.map((sofa) => (
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