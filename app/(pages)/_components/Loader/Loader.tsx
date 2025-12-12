interface LoaderProps {
  modal?: boolean;
  message?: string;
}

export default function Loader({ modal = false, message = '' }: LoaderProps) {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center text-center ${
        modal
          ? ''
          : 'absolute inset-0 min-w-screen min-h-screen bg-[rgba(136, 136, 136, 0.50)] backdrop-blur'
      }`}
    >
      <h4>{message}</h4>
      <div className="border-8 border-solid border-[#F3F3F3] border-t-background-secondary rounded-[50%] w-[40px] h-[40px] animate-spin" />
    </div>
  );
}
