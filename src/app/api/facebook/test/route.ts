import { NextRequest, NextResponse } from 'next/server';

const FACEBOOK_USER_TOKEN = process.env.FACEBOOK_USER_TOKEN;
const FACEBOOK_API_URL = 'https://graph.facebook.com/v18.0';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'config';

    switch (testType) {
      case 'config':
        return NextResponse.json({
          success: true,
          data: {
            hasUserToken: !!FACEBOOK_USER_TOKEN,
            tokenLength: FACEBOOK_USER_TOKEN?.length || 0,
            tokenPreview: FACEBOOK_USER_TOKEN ? `${FACEBOOK_USER_TOKEN.slice(0, 10)}...` : 'Not set',
            environment: process.env.NODE_ENV,
            tokenType: 'User Access Token (not Page)',
            apiUrl: FACEBOOK_API_URL
          },
          message: 'Facebook USER token configuration check'
        });

      case 'validate':
        if (!FACEBOOK_USER_TOKEN) {
          return NextResponse.json({
            success: false,
            message: 'Facebook USER token not configured'
          }, { status: 400 });
        }

        // Test the user token by getting user profile
        try {
          const response = await fetch(
            `${FACEBOOK_API_URL}/me?fields=id,name,email&access_token=${FACEBOOK_USER_TOKEN}`
          );

          if (response.ok) {
            const userData = await response.json();
            return NextResponse.json({
              success: true,
              data: {
                tokenValid: true,
                userId: userData.id,
                userName: userData.name,
                userEmail: userData.email,
                tokenType: 'User Access Token'
              },
              message: 'Facebook USER token is valid and working'
            });
          } else {
            const errorData = await response.text();
            return NextResponse.json({
              success: false,
              data: {
                tokenValid: false,
                status: response.status,
                error: errorData
              },
              message: 'Facebook USER token validation failed'
            }, { status: 400 });
          }
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: `Token validation failed: ${error.message}`
          }, { status: 500 });
        }

      case 'permissions':
        if (!FACEBOOK_USER_TOKEN) {
          return NextResponse.json({
            success: false,
            message: 'Facebook USER token not configured'
          }, { status: 400 });
        }

        // Check token permissions
        try {
          const response = await fetch(
            `${FACEBOOK_API_URL}/me/permissions?access_token=${FACEBOOK_USER_TOKEN}`
          );

          if (response.ok) {
            const permissionsData = await response.json();
            return NextResponse.json({
              success: true,
              data: {
                permissions: permissionsData.data,
                grantedPermissions: permissionsData.data?.filter((p: any) => p.status === 'granted') || [],
                deniedPermissions: permissionsData.data?.filter((p: any) => p.status === 'declined') || []
              },
              message: 'Facebook USER token permissions retrieved'
            });
          } else {
            const errorData = await response.text();
            return NextResponse.json({
              success: false,
              data: {
                status: response.status,
                error: errorData
              },
              message: 'Failed to get token permissions'
            }, { status: 400 });
          }
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: `Permissions check failed: ${error.message}`
          }, { status: 500 });
        }

      case 'posts':
        if (!FACEBOOK_USER_TOKEN) {
          return NextResponse.json({
            success: false,
            message: 'Facebook USER token not configured'
          }, { status: 400 });
        }

        // Test posting capability (get user feed)
        try {
          const response = await fetch(
            `${FACEBOOK_API_URL}/me/posts?limit=5&access_token=${FACEBOOK_USER_TOKEN}`
          );

          if (response.ok) {
            const postsData = await response.json();
            return NextResponse.json({
              success: true,
              data: {
                canAccessPosts: true,
                postsCount: postsData.data?.length || 0,
                samplePost: postsData.data?.[0] || null
              },
              message: 'Facebook USER can access posts'
            });
          } else {
            const errorData = await response.text();
            return NextResponse.json({
              success: false,
              data: {
                canAccessPosts: false,
                status: response.status,
                error: errorData
              },
              message: 'Cannot access user posts - may need user_posts permission'
            }, { status: 400 });
          }
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: `Posts test failed: ${error.message}`
          }, { status: 500 });
        }

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid test type. Use: config, validate, permissions, or posts'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Facebook test error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Test failed'
    }, { status: 500 });
  }
}