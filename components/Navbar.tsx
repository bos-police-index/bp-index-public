import * as React from "react";
import { useRouter } from "next/router";
import { Route } from "nextjs-routes";
import Link from "next/link";
import Image from "next/image";

import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import DataIcon from "@mui/icons-material/Assessment";
import InfoIcon from "@mui/icons-material/Info";
import FeedbackIcon from "@mui/icons-material/Feedback";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";

import SearchBar from "./SearchBar";
import BPILogo from '../public/BPI-Logo-White.png';
import "../public/favicon.ico";

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
  justify-content: center;
  gap: 2rem;

  @media (min-width: 768px) {
    justify-content: space-between;
  }
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

export default function Navbar() {
  const [searchBarOpen, setSearchBarOpen] = React.useState<boolean>(false);
  const [bottomNavValue, setBottomNavValue] = React.useState(0);
  const router = useRouter();

  const handleSearchBarOpen = () => {
    setSearchBarOpen(true);
  };

  const handleSearchBarClose = () => {
    setSearchBarOpen(false);
  };

  const handleBottomNavChange = (event: React.SyntheticEvent, newValue: number) => {
    setBottomNavValue(newValue);
    switch (newValue) {
      case 0:
        router.push({ pathname: "/" } as Route);
        break;
      case 1:
        router.push({ pathname: "/data" } as Route);
        break;
      case 2:
        router.push({ pathname: "/about" } as Route);
        break;
      case 3:
        router.push({ pathname: "/feedback" } as Route);
        break;
      case 4:
        handleSearchBarOpen();
        break;
    }
  };

  return (
    <>
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
            <a
              href="https://forms.boston.gov/appbuilder/eFormRender.html?code=AA6693252735B48211CC5C0E68BC949D&Process=OPATPoliceAccountability"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--white)',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                transition: 'var(--transition-default)',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              File Claim
            </a>
            <SearchBar title="" officerName="" />
          </NavLinks>
        </NavContent>
      </StyledNav>

      {/* Mobile Search Bar - appears above bottom navigation */}
      {searchBarOpen && (
        <Box sx={{
          position: 'fixed',
          bottom: 56, 
          left: 0,
          right: 0,
          background: 'var(--bpi_deep_green)',
          p: '12px 16px',
          display: { xs: 'block', md: 'none' },
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 11
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <Box sx={{ flex: 1 }}>
              <SearchBar title="" officerName="" onSearchExecuted={handleSearchBarClose} />
            </Box>
            <IconButton
              onClick={handleSearchBarClose}
              sx={{ color: 'white', p: 1 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Bottom Navigation for Mobile */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 10,
          display: { xs: 'block', md: 'none' },
          borderTop: '1px solid rgba(0, 0, 0, 0.1)'
        }} 
        elevation={3}
      >
        <BottomNavigation
          value={bottomNavValue}
          onChange={handleBottomNavChange}
          sx={{
            backgroundColor: 'var(--bpi_deep_green)',
            '& .MuiBottomNavigationAction-root': {
              color: 'rgba(255, 255, 255, 0.6)',
              '&.Mui-selected': {
                color: 'white',
              }
            }
          }}
        >
          <BottomNavigationAction 
            label="Home" 
            icon={<HomeIcon />} 
          />
          <BottomNavigationAction 
            label="Data" 
            icon={<DataIcon />} 
          />
          <BottomNavigationAction 
            label="About" 
            icon={<InfoIcon />} 
          />
          <BottomNavigationAction 
            label="Feedback" 
            icon={<FeedbackIcon />} 
          />
          <BottomNavigationAction 
            label="Search" 
            icon={<SearchIcon />} 
          />
        </BottomNavigation>
      </Paper>
    </>
  );
}
