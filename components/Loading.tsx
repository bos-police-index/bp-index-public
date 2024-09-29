// components/Loading.jsx
import React from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';
import { bpi_deep_green } from "@styles/theme/lightTheme";

const Loading = () => {
  return (
		<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
			<Typography variant="h6" component="div" gutterBottom color={bpi_deep_green}>
				Loading large quantity of data, this may up to 10 seconds
			</Typography>
			{/* <CircularProgress /> */}
		</Box>
  );
};

export default Loading;
