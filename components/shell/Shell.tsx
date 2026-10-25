import Ticker from "./Ticker";
import Nav from "./Nav";
import MenuDrawer from "./MenuDrawer";
import CartDrawer from "./CartDrawer";
import SearchSheet from "./SearchSheet";
import Toast from "./Toast";
import Footer from "./Footer";
import WhatsApp from "./WhatsApp";
import TabBar from "./TabBar";
import StoreProvider from "./StoreProvider";
import LoginModal from "./LoginModal";
import MarqueeDrag from "@/components/ui/MarqueeDrag";
import { getMenuTree } from "@/lib/nav";

/** Everything that wraps every page. Mounted once, in the root layout. */
export default async function Shell({ children }: { children: React.ReactNode }) {
  const navMenu = await getMenuTree();

  return (
    <StoreProvider>
      <Ticker />
      <Nav navMenu={navMenu} />
      {children}
      <Footer />
      <WhatsApp />
      <TabBar />
      <MenuDrawer navMenu={navMenu} />
      <CartDrawer />
      <SearchSheet navMenu={navMenu} />
      <LoginModal />
      <Toast />
      <MarqueeDrag />
    </StoreProvider>
  );
}
