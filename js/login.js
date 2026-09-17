/**
 * BESTBET9 - Login Page Interaction Script
 */

function handleLogin(e) {
  if (e) e.preventDefault();
  
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  
  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';
  
  if (!username) {
    if (usernameInput) usernameInput.focus();
    return false;
  }
  
  if (!password) {
    if (passwordInput) passwordInput.focus();
    return false;
  }

  // Simulated authentication / demo session
  console.log('Login initiated for user:', username);
  
  // Store authentic demo session matching reference website structure
  try {
    const isDemo = username.toLowerCase().includes('demo');
    const sessionData = {
      uname: isDemo ? 'Demo' : username,
      bal: 1500,
      exp: 0,
      bcode: '85830012514',
      isDemoUser: isDemo
    };
    
    localStorage.setItem('persist:root', JSON.stringify({
      token: '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo_token"',
      logedIn: 'true',
      rulesLogin: 'false',
      popUpLogin: 'false',
      data: JSON.stringify(sessionData)
    }));

    localStorage.setItem('bestbet9_user', JSON.stringify({
      username: isDemo ? 'Demo' : username,
      balance: 1500,
      exposure: 0,
      role: isDemo ? 'DEMO' : 'USER',
      loginTime: new Date().toISOString()
    }));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }

  // Navigate to Dashboard
  window.location.href = '/home';
  return false;
}

function handleDemoLogin() {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  
  if (usernameInput) usernameInput.value = 'Demo';
  if (passwordInput) passwordInput.value = '123456';
  
  // Set demo credentials and proceed immediately
  try {
    const sessionData = {
      uname: 'Demo',
      bal: 1500,
      exp: 0,
      bcode: '85830012514',
      isDemoUser: true
    };
    
    localStorage.setItem('persist:root', JSON.stringify({
      token: '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo_token"',
      logedIn: 'true',
      rulesLogin: 'false',
      popUpLogin: 'false',
      data: JSON.stringify(sessionData)
    }));

    localStorage.setItem('bestbet9_user', JSON.stringify({
      username: 'Demo',
      balance: 1500,
      exposure: 0,
      role: 'DEMO',
      loginTime: new Date().toISOString()
    }));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }

  // Transition to demo dashboard
  window.location.href = '/home';
}
