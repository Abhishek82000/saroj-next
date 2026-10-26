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
import { getHandicraftData } from "@/lib/handicraft";

/** Everything that wraps every page. Mounted once, in the root layout. */
export default async function Shell({ children }: { children: React.ReactNode }) {
  const [navMenu, { faces }] = await Promise.all([getMenuTree(), getHandicraftData()]);
  /* The /handicraft footer lists the handicraft categories in place of the fabric ones. */
  const handicraftCats = faces.filter((f) => f.href).map((f) => ({ name: f.name, href: f.href!, image: f.img }));

  return (
    <StoreProvider>
      <Ticker />
      <Nav navMenu={navMenu} />
      {children}
      <Footer handicraftCats={handicraftCats} />
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
