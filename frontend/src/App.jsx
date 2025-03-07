/*
#######################################################################
#
# Copyright (C) 2020-2025 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without
# the express written permission of the copyright holder.
#
#######################################################################
*/

import Login from './components/login';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Dashboard from './components/Dashboard';
import {WorkspaceProvider} from './context/WorkspaceContext';

/**
 * Simple component with no state.
 * @returns {object} JSX
 */
function App() {
  return (
    <Router>
      <WorkspaceProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </WorkspaceProvider>
    </Router>
  );
}

export default App;
