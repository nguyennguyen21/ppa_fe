import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa6";

/**
 * Nút tròn “Ủng hộ CODEX” nằm cuối thanh điều hướng (sidebar).
 * Chuyển thẳng tới trang /support để người dùng xem thông tin nhận ủng hộ qua ngân hàng.
 */
const SupportRoundButton = () => {
  return (
    <Link
      to="/support"
      aria-label="Ủng hộ CODEX"
      title="Ủng hộ CODEX"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
    >
      <FaHeart size={20} aria-hidden="true" />
    </Link>
  );
};

export default SupportRoundButton;
