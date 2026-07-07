type Props = {
  id: string;
  name: string;
  image: string;
  selected: boolean;
  onClick: () => void;
};

export default function SofaCard({
  name,
  image,
  selected,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 transition

      ${
        selected
          ? "border-black shadow-lg"
          : "border-gray-200 hover:border-gray-400"
      }`}
    >
      <img
        src={image}
        alt={name}
        className="h-40 w-full object-contain"
      />

      <h3 className="mt-3 font-semibold">
        {name}
      </h3>
    </button>
  );
}