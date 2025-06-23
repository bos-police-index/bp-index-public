// components/Loading.jsx
import React from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { bpi_deep_green } from "@styles/theme/lightTheme";

const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
`;

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  gap: '2rem',
  padding: '2rem',
  background: 'var(--background-primary)',
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  color: 'var(--bpi_deep_green)',
  textAlign: 'center',
  fontWeight: 500,
  animation: `${pulse} 2s ease-in-out infinite`,
}));

const StyledProgress = styled(CircularProgress)(({ theme }) => ({
  color: 'var(--bpi_deep_green)',
  '& .MuiCircularProgress-circle': {
    strokeLinecap: 'round',
  },
}));

const Loading = () => {
  return (
    <LoadingContainer>
      <StyledProgress size={60} thickness={4} />
      <LoadingText variant="h6">
        Loading data...
        <br />
        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          This may take up to 10 seconds
        </span>
      </LoadingText>
    </LoadingContainer>
  );
};

export default Loading;
