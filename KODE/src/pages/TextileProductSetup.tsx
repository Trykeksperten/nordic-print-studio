import { Navigate, useParams } from "react-router-dom";

const validProductIds = new Set([
  "basic-tshirt",
  "heavyweight-tshirt",
  "performance-tshirt",
  "authentic-sweat",
  "standard-hoodie",
  "premium-hoodie",
  "byb-oversized-acid-wash-tee",
  "byb-ladies-fluffy-sweatpants",
]);

const TextileProductSetup = () => {
  const { productId } = useParams<{ productId: string }>();

  if (!productId || !validProductIds.has(productId)) {
    return <Navigate to="/tekstiltryk/produkter" replace />;
  }

  return <Navigate to={`/tekstiltryk/design?product=${productId}`} replace />;
};

export default TextileProductSetup;
