import { UserIcon } from "../icons";
import NavItem from "./NavItem";

export default function ProfileNav() {
  return <NavItem to="/profile" label="Хэрэглэгч" icon={UserIcon} />;
}
