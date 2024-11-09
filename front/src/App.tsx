import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Outlet, Link } from "react-router-dom";

import './App.css';
import NavBar from './components/NavBar'
import Summary from './components/Summary'
import Positions from './components/Positions'
import Position from './components/Position'
import Orders from './components/Orders'
import Order from './components/Order'
import Simulation from "./components/Simulation";
import Report from "./components/Report";
import Jobs from "./components/Jobs";
import Train from "./components/Train";
import Symbol from "./components/Symbol";
import Day from "./components/Day";
import TrainResult from "./components/TrainResult";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <NavBar />
          <Routes>
            <Route path="/" element={<Outlet />}>
              <Route index element={<Summary />} />
              <Route path="positions/:id" element={<Position />} />
              <Route path="positions" element={<Positions />} />
              <Route path="orders/:id" element={<Order />} />
              <Route path="orders" element={<Orders />} />
              <Route path="simulation" element={<Simulation />} />
              <Route path="report" element={<Report />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="train" element={<Train />} />
              <Route path="train/:name/:period" element={<TrainResult />} />
              <Route path="days/:date/symbols/:ticker" element={<Symbol />} />
              <Route path="days/:date" element={<Day />} />
            </Route>
          </Routes>
        </header>
      </div>
    </BrowserRouter>
  );
}

export default App;
