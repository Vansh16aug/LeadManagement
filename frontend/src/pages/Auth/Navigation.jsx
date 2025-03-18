import { useState } from "react";
import {
  AiOutlineHome,
  AiOutlineShopping,
  AiOutlineLogin,
  AiOutlineUserAdd,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useLogoutMutation } from "../../redux/api/usersApiSlice";
import { logout } from "../../redux/features/auth/authSlice";
import FavoritesCount from "../Products/FavoritesCount";

const Navigation = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [logoutApiCall] = useLogoutMutation();

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className="flex justify-between items-center p-4 text-white bg-[#000] w-full h-[60px] fixed top-0 left-0 z-50"
      id="navigation-container"
    >
      {/* Left side - Logo/Home */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center">
          <AiOutlineHome size={26} />
          <span className="ml-2">HOME</span>
        </Link>
        <Link to="/shop" className="flex items-center">
          <AiOutlineShopping size={26} />
          <span className="ml-2">SHOP</span>
        </Link>
        <Link to="/cart" className="flex items-center relative">
          <AiOutlineShoppingCart size={26} />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 px-2 py-1 text-xs text-white bg-pink-500 rounded-full">
              {cartItems.reduce((a, c) => a + c.qty, 0)}
            </span>
          )}
          <span className="ml-2">CART</span>
        </Link>
        <Link to="/favorite" className="flex items-center">
          <FaHeart size={20} />
          <span className="ml-2">FAVORITES</span>
          <FavoritesCount />
        </Link>
      </div>

      {/* Right side - Login/Profile */}
      <div className="relative">
        {userInfo ? (
          <button
            onClick={toggleDropdown}
            className="flex items-center text-white focus:outline-none"
          >
            <span className="mr-2">{userInfo.username}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ml-1 ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        ) : (
          <div className="flex space-x-4">
            <Link to="/login" className="flex items-center">
              <AiOutlineLogin size={26} />
              <span className="ml-2">LOGIN</span>
            </Link>
            <Link to="/register" className="flex items-center">
              <AiOutlineUserAdd size={26} />
              <span className="ml-2">REGISTER</span>
            </Link>
          </div>
        )}

        {dropdownOpen && userInfo && (
          <ul className="absolute right-0 mt-2 w-40 bg-white text-gray-800 shadow-lg rounded-lg">
            {userInfo.isAdmin && (
              <>
                <li>
                  <Link to="/admin/dashboard" className="block px-4 py-2">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/admin/productlist" className="block px-4 py-2">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/admin/categorylist" className="block px-4 py-2">
                    Category
                  </Link>
                </li>
                <li>
                  <Link to="/admin/orderlist" className="block px-4 py-2">
                    Orders
                  </Link>
                </li>
                <li>
                  <Link to="/admin/userlist" className="block px-4 py-2">
                    Users
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link to="/profile" className="block px-4 py-2">
                Profile
              </Link>
            </li>
            <li>
              <button
                onClick={logoutHandler}
                className="block w-full px-4 py-2 text-left"
              >
                Logout
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Navigation;
