import * as React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';

import JenkinsStatus from './JenkinsStatus'
import PositionsSummary from './PositionsSummary'
import { Container } from '@mui/system';

export default function NavBar() {
  return (
    <Container>
    <Box display="flex"
    justifyContent="center"
    alignItems="center"
    sx={{ margin: 10}}>
      <Card>
        <CardContent>
          <JenkinsStatus />
          <PositionsSummary />
        </CardContent>
      </Card>
    </Box>
    </Container>
  )
}
  