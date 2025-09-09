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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from '@mui/material/Tooltip';

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
  const [isInterstitialOpen, setIsInterstitialOpen] = React.useState(false);
  const [countdown, setCountdown] = React.useState(3);
  const router = useRouter();
  
  const externalClaimUrl = "https://forms.boston.gov/appbuilder/eFormRender.html?code=AA6693252735B48211CC5C0E68BC949D&Process=OPATPoliceAccountability";

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInterstitialOpen && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleProceedToExternal();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isInterstitialOpen, countdown]);

  const handleSearchBarOpen = () => {
    setSearchBarOpen(true);
  };

  const handleSearchBarClose = () => {
    setSearchBarOpen(false);
  };

  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsInterstitialOpen(true);
    setCountdown(3);
  };

  const handleInterstitialClose = () => {
    setIsInterstitialOpen(false);
    setCountdown(3);
  };

  const handleProceedToExternal = () => {
    window.open(externalClaimUrl, '_blank', 'noopener,noreferrer');
    setIsInterstitialOpen(false);
    setCountdown(3);
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
            <Tooltip title="This link will take you to an external Boston.gov website" arrow>
              <a
                href={externalClaimUrl}
                onClick={handleExternalLinkClick}
                style={{
                  color: 'var(--white)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition-default)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                File Claim
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </a>
            </Tooltip>

            {/* External Link Interstitial Dialog */}
            <Dialog
              open={isInterstitialOpen}
              onClose={handleInterstitialClose}
              aria-labelledby="external-link-dialog-title"
              PaperProps={{
                sx: {
                  maxWidth: '500px',
                  mx: 2
                }
              }}
            >
              <DialogTitle id="external-link-dialog-title">
                Leaving Boston Police Index
              </DialogTitle>
              <DialogContent>
                <Typography>
                  You are about to leave the Boston Police Index website and go to the City of Boston's website to file a claim. 
                  This external site is operated by the City of Boston and is not part of the Boston Police Index.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    External link: boston.gov
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleInterstitialClose}>Cancel</Button>
                <Button 
                  onClick={handleProceedToExternal}
                  variant="contained" 
                  endIcon={<OpenInNewIcon />}
                >
                  Continue to External Site
                </Button>
              </DialogActions>
            </Dialog>
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

      {/* Interstitial Dialog for External Link Warning */}
      <Dialog
        open={isInterstitialOpen}
        onClose={handleInterstitialClose}
        aria-labelledby="interstitial-dialog-title"
        aria-describedby="interstitial-dialog-description"
      >
        <DialogTitle id="interstitial-dialog-title" sx={{ 
          backgroundColor: 'var(--bpi_deep_green)', 
          color: 'white',
          fontWeight: 500,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          External Link Warning
        </DialogTitle>
        <DialogContent sx={{ 
          backgroundColor: 'var(--bpi_deep_green)',
          color: 'white',
          '& .MuiTypography-root': {
            color: 'white',
          }
        }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are about to leave the BPI website and be redirected to an external site (Boston.gov) to file a claim. Please ensure that you are providing your information on the official Boston.gov website.
          </Typography>
          <Typography variant="body1">
            If you have any questions or concerns, please contact the OPAT team at{' '}
            <a href="mailto:opat@boston.gov" style={{ color: 'var(--bpi_light_blue)', textDecoration: 'underline' }}>
              opat@boston.gov
            </a>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          backgroundColor: 'var(--bpi_deep_green)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Button onClick={handleInterstitialClose} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button onClick={handleProceedToExternal} sx={{ color: 'white' }}>
            Proceed ({countdown}s)
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
