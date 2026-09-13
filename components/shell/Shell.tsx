import Ticker from "./Ticker";
import Nav from "./Nav";
import MenuDrawer from "./MenuDrawer";
import CartDrawer from "./CartDrawer";
import SearchSheet from "./SearchSheet";
import Toast from "./Toast";
import Footer from "./Footer";
import WhatsApp from "./WhatsApp";
import StoreProvider from "./StoreProvider";

/** Everything that wraps every page. Mounted once, in the root layout. */
export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Ticker />
      <Nav />
      {children}
      <Footer />
      <WhatsApp />
      <MenuDrawer />
      <CartDrawer />
      <SearchSheet />
      <Toast />
    </StoreProvider>
  );
}
