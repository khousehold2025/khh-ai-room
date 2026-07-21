"use client";

import { useRef } from "react";

type Props = {
  image: string |null;
  roomType?: "with-sofa" | "empty-room" | null;
  onRoomTypeChange?: (
    type: "with-sofa" | "empty-room"
  ) => void;
  onSelect: (file: File) => void;
};

export default function UploadPanel({
  image,
  roomType,
  onRoomTypeChange,
  onSelect,
}: Props) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">

{onRoomTypeChange && (
<div className="grid grid-cols-2 gap-3 mb-5">

  <button
    type="button"
    onClick={() => onRoomTypeChange("with-sofa")}
    className={`rounded-lg border p-3 transition
      ${
        roomType === "with-sofa"
          ? "bg-blue-600 text-white border-blue-600"
          : "border-gray-300"
      }`}
  >
    🛋 기존 소파가 있는 사진
  </button>

  <button
    type="button"
    onClick={() => onRoomTypeChange("empty-room")}
    className={`rounded-lg border p-3 transition
      ${
        roomType === "empty-room"
          ? "bg-green-600 text-white border-green-600"
          : "border-gray-300"
      }`}
  >
    ⬜ 소파가 없는 사진
  </button>

</div>
)}
        공간 사진

      </h2>

      <div
onClick={() => {

    // roomType 기능을 사용하는 화면일 때만 검사
    if (onRoomTypeChange && !roomType) {

        alert("먼저 공간사진 유형을 선택하세요.");

        return;
    }

    input.current?.click();

}}
        className={`
border-2
border-dashed
rounded-xl
h-96
overflow-hidden
flex
items-center
justify-center
transition

${
onRoomTypeChange
    ? (
        roomType
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-50"
      )
    : "cursor-pointer"
}
`}
      >
        {image ? (
          <img
            src={image}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-gray-400">
          {onRoomTypeChange
    ? (
        roomType
            ? "클릭해서 공간사진 업로드"
            : "먼저 공간사진 유형을 선택하세요"
      )
    : "클릭해서 업로드"}
          </span>
        )}
      </div>

    <input
 disabled={onRoomTypeChange ? !roomType : false}
        hidden
        ref={input}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (!e.target.files?.length) return;

          onSelect(e.target.files[0]);
        }}
      />
    </div>
  );
}