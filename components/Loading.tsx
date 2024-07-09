// components/Loading.jsx
import React from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';

const Loading = () => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
      <Typography variant="h6" component="div" gutterBottom color={'white'}>
        Loading large quantity of data, this may up to 10 seconds 
      </Typography>
      {/* <CircularProgress /> */}
    </Box>
  );
};

export default Loading;
