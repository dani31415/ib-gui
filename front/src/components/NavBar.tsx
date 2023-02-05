import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import MenuItem from '@mui/material/MenuItem';
import { Link } from "react-router-dom";
import MenuList from '@mui/material/MenuList';

import './NavBar.css';

export default function NavBar() {
  return (
    <Box>
      <AppBar position='static'>
        <Toolbar>
          <MenuList className="horiz-menu">
            <MenuItem component={Link} to='/'>Home</MenuItem>
            <MenuItem component={Link} to='/positions'>Positions</MenuItem>
            <MenuItem component={Link} to='/orders'>Orders</MenuItem>
            <MenuItem component={Link} to='/report'>Report</MenuItem>
            <MenuItem component={Link} to='/jobs'>Jobs</MenuItem>
          </MenuList>
        </Toolbar>
      </AppBar>
    </Box>
  )
}