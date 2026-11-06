
import type { ChangeEvent } from "react";

interface SwitchButtonProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

const SwitchButton = ({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  className = "",
  ariaLabel = "Bật hoặc tắt",
}: SwitchButtonProps) => {
  const isControlled = checked !== undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  return (
    <label
      className={[
        "group flex h-[35px] w-[35px] items-center justify-center",
        "overflow-hidden",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
        className,
      ].join(" ")}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={isControlled ? checked : undefined}
        defaultChecked={!isControlled ? defaultChecked : undefined}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
      />

      <span
        className={[
          "pointer-events-none relative flex h-[35px] w-[35px]",
          "flex-col items-center justify-center",
          "transition-transform duration-200 ease-in-out",
          "group-hover:[&_.row-horizontal]:w-[100px]",
          "group-hover:[&_.row-vertical]:h-[100px]",
          "group-hover:[&_.middle-dot]:!h-[35px]",
          "group-hover:[&_.middle-dot-horizontal]:!w-[35px]",
          "group-has-[:checked]:rotate-45",
          "group-has-[:checked]:scale-[1.2]",
          "group-has-[:checked]:[&_.row-horizontal]:w-[100px]",
          "group-has-[:checked]:[&_.row-vertical]:h-[100px]",
          "group-has-[:checked]:[&_.middle-dot]:!h-[35px]",
          "group-has-[:checked]:[&_.middle-dot-horizontal]:!w-[35px]",
        ].join(" ")}
      >
        {/* Hàng chấm phía trên */}
        <span className="row flex h-1/2 w-full items-start justify-between">
          <Dot />
          <Dot />
        </span>

        {/* Hàng chấm phía dưới */}
        <span className="row-bottom flex h-1/2 w-full items-end justify-between">
          <Dot />
          <Dot />
        </span>

        {/* Đường dọc */}
        <span
          className={[
            "row-vertical absolute flex h-full w-fit",
            "flex-col items-center justify-between",
            "transition-[height] duration-200 ease-in-out",
          ].join(" ")}
        >
          <Dot />
          <Dot extraClass="middle-dot" />
          <Dot />
        </span>

        {/* Đường ngang */}
        <span
          className={[
            "row-horizontal absolute flex h-fit w-full",
            "items-center justify-between",
            "transition-[width] duration-200 ease-in-out",
          ].join(" ")}
        >
          <Dot />
          <Dot extraClass="middle-dot-horizontal" />
          <Dot />
        </span>
      </span>
    </label>
  );
};

interface DotProps {
  extraClass?: string;
}

const Dot = ({ extraClass = "" }: DotProps) => (
  <span
    className={[
      "dot h-2 w-2 shrink-0 rounded-full border-2 border-black",
      "transition-[width,height,border-radius] duration-200 ease-in-out",
      extraClass,
    ].join(" ")}
  />
);

export default SwitchButton;
