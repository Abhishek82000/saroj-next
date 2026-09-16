import Ticker from "./Ticker";
import Nav from "./Nav";
import MenuDrawer from "./MenuDrawer";
import CartDrawer from "./CartDrawer";
import SearchSheet from "./SearchSheet";
import Toast from "./Toast";
import Footer from "./Footer";
import WhatsApp from "./WhatsApp";
import StoreProvider from "./StoreProvider";
import { getNavMenu } from "@/lib/nav";

/** Everything that wraps every page. Mounted once, in the root layout. */
export default async function Shell({ children }: { children: React.ReactNode }) {
  const navMenu = await getNavMenu();

  return (
    <StoreProvider>
      <Ticker />
      <Nav navMenu={navMenu} />
      {children}
      <Footer />
      <WhatsApp />
      <MenuDrawer navMenu={navMenu} />
      <CartDrawer />
      <SearchSheet />
      <Toast />
    </StoreProvider>
  );
}
