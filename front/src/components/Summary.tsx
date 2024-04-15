import * as React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';

import JenkinsStatus from './JenkinsStatus'
import OrderSummary from './OrderSummary'
import { Container } from '@mui/system';

export default function NavBar() {
  return (
    <Container>
    <Box display="flex"
    justifyContent="center"
    alignItems="center"
    sx={{ margin: 10}}>
      <Card>
        <CardContent style={{textAlign: 'center', fontSize: '120%'}}>
          <JenkinsStatus />
          <OrderSummary />
        </CardContent>
      </Card>
    </Box>
    </Container>
  )
}
