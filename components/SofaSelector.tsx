"use client";

type Props = {
  selected: string;
  onSelect: (id: string) => void;
};

export default function SofaSelector({
  selected,
  onSelect,
}: Props) {

  return (

    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">

        ② 소파 선택

      </h2>

      <button
        onClick={() => onSelect("sofa01")}
        className={`w-full rounded-xl border p-4

        ${
          selected==="sofa01"

          ? "border-black"

          : "border-gray-300"

        }`}
      >

        <img
          src="/sofas/sofa01.png"
          className="h-56 mx-auto object-contain"
        />

        <div className="font-semibold mt-4">

          클라우드 모듈소파

        </div>

      </button>

    </div>

  );

}