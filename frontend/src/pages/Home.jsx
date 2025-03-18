import { Link, useParams } from "react-router-dom";
import { useGetProductsQuery } from "../redux/api/productApiSlice";
import Loader from "../components/Loader";
import Message from "../components/Message";
import Header from "../components/Header";
import Product from "./Products/Product";

const Home = () => {
  const { keyword } = useParams();
  const { data, isLoading, isError } = useGetProductsQuery({ keyword });

  return (
    <>
      {!keyword ? <Header /> : null}
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <Message variant="danger">
          {isError?.data?.message || isError.error}
        </Message>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center mt-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">
              Special Products
            </h1>
            <Link
              to="/shop"
              className="bg-pink-600 text-white font-bold rounded-full py-3 px-8 hover:bg-pink-700 transition duration-300"
            >
              Shop Now
            </Link>
          </div>

          <div className="container mx-auto px-4 mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.products.map((product) => (
                <div
                  key={product._id}
                  className="hover:shadow-lg transition-shadow duration-300"
                >
                  <Product product={product} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Home;
