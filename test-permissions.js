// Test what permissions the current token has
async function testPermissions() {
  const token = 'EAAPlw1yjHtwBPHLQFsyKFqKno4cjGJWWyJXqKb7fCKqJ46B9ZCae2K9jSopN9eWeO9Hoag3pL9bznEZBClQ8ZA9QfmvhGo7ozcFPVAtSQKmJizXsYsgiGm455mmLZBKd3QsDUMwCIhYSL1hChGFk3AZBsZA7e8LaHrNyc3iEAUiZACPzAdxbDCjvhbtrXV7';
  
  try {
    console.log('🔍 Checking token permissions...');
    
    const response = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${token}`);
    const data = await response.json();
    
    console.log('📋 Token Permissions:');
    if (data.data) {
      data.data.forEach(permission => {
        const status = permission.status === 'granted' ? '✅' : '❌';
        console.log(`${status} ${permission.permission}: ${permission.status}`);
      });
    } else {
      console.log('❌ Could not fetch permissions:', data);
    }
    
  } catch (error) {
    console.error('Error checking permissions:', error);
  }
}

testPermissions();