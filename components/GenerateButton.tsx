type Props = {
  disabled: boolean;
};

export default function GenerateButton({
  disabled,
}: Props) {

  return (

    <button
      disabled={disabled}
      className="w-full mt-10 rounded-xl bg-black text-white py-5 text-xl disabled:opacity-40"
    >

      AI 배치하기

    </button>

  );

}