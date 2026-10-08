import { HomeIcon } from "../icons";
import NavItem from "./NavItem";

export default function HomeNav() {
  return <NavItem to="/" label="Нүүр" icon={HomeIcon} end />;
}
