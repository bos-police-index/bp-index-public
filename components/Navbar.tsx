import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import SearchBar from "./SearchBar";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import BPILogo from '../public/BPI-Logo-White.png';
import { useRouter } from "next/router";
import { styled } from "@mui/material/styles";
import "../public/favicon.ico";
import { bpi_deep_green } from "@styles/theme/lightTheme";
import { Route } from "nextjs-routes";

const StyledNav = styled('nav')`
  background: var(--bpi_deep_green);
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: var(--shadow-md);
  transition: var(--transition-default);

  @media (min-width: 768px) {
    padding: 1rem 2rem;
  }
`;

const NavContent = styled('div')`
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
`;

const NavLinks = styled('div')`
  display: none;
  align-items: center;
  gap: 2rem;

  @media (min-width: 768px) {
    display: flex;
  }
`;

const NavLink = styled(Link)`
  color: var(--white);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  transition: var(--transition-default);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const StyledButton = styled(Button)`
  color: var(--white);
  padding: 0.5rem;
  min-width: unset;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export default function Navbar() {
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState<null | HTMLElement>(null);
  const router = useRouter();

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleNavigate = (route: Route["pathname"]) => {
    router.push({ pathname: route } as Route);
    handleMobileMenuClose();
  };

  return (
    <StyledNav>
      <NavContent>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src={BPILogo}
            alt="BPI Logo"
            width={120}
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        <NavLinks>
          <NavLink href="/data">Data</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/feedback">Feedback</NavLink>
          <SearchBar title="" officerName="" />
        </NavLinks>

        <div className="md:hidden">
          <StyledButton
            onClick={handleMobileMenuOpen}
            aria-label="Open menu"
          >
            <MenuIcon sx={{ fontSize: 28 }} />
          </StyledButton>
          
          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={handleMobileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiPaper-root': {
                borderRadius: 'var(--radius-md)',
                marginTop: '0.5rem',
                minWidth: '200px',
                boxShadow: 'var(--shadow-lg)',
              }
            }}
            PopoverClasses={{
              root: 'mui-popover-zindex'
            }}
          >
            <MenuItem onClick={() => handleNavigate("/data")}>Data</MenuItem>
            <MenuItem onClick={() => handleNavigate("/about")}>About</MenuItem>
            <MenuItem onClick={() => handleNavigate("/feedback")}>Feedback</MenuItem>
            <MenuItem sx={{ padding: '0.5rem 1rem' }}>
              <SearchBar title="" officerName="" />
            </MenuItem>
          </Menu>
        </div>
      </NavContent>
    </StyledNav>
  );
}
