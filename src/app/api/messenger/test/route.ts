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
            apiUrl: FACEBOOK_API_URL
          },
          message: 'Messenger USER token configuration check'
        });

      case 'conversations':
        if (!FACEBOOK_USER_TOKEN) {
          return NextResponse.json({
            success: false,
            message: 'Facebook USER token not configured'
          }, { status: 400 });
        }

        // Test conversations API
        try {
          const response = await fetch(
            `${FACEBOOK_API_URL}/me/conversations?limit=5&access_token=${FACEBOOK_USER_TOKEN}`
          );

          const responseText = await response.text();
          console.log('Conversations API response:', responseText);

          if (response.ok) {
            const data = JSON.parse(responseText);
            return NextResponse.json({
              success: true,
              data: {
                conversationsFound: data.data?.length || 0,
                hasConversations: !!(data.data && data.data.length > 0),
                sampleConversation: data.data?.[0] || null,
                permissions: 'Conversations API accessible'
              },
              message: 'Conversations API test successful'
            });
          } else {
            return NextResponse.json({
              success: false,
              data: {
                status: response.status,
                error: responseText,
                permissions: 'Conversations API not accessible'
              },
              message: 'Conversations API test failed - may need user_messages permission'
            });
          }
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: `Conversations test failed: ${error.message}`
          }, { status: 500 });
        }

      case 'friends':
        if (!FACEBOOK_USER_TOKEN) {
          return NextResponse.json({
            success: false,
            message: 'Facebook USER token not configured'
          }, { status: 400 });
        }

        // Test friends API
        try {
          const response = await fetch(
            `${FACEBOOK_API_URL}/me/friends?limit=5&access_token=${FACEBOOK_USER_TOKEN}`
          );

          if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
              success: true,
              data: {
                friendsFound: data.data?.length || 0,
                hasFriends: !!(data.data && data.data.length > 0),
                sampleFriend: data.data?.[0] || null,
                permissions: 'Friends API accessible'
              },
              message: 'Friends API test successful'
            });
          } else {
            const errorData = await response.text();
            return NextResponse.json({
              success: false,
              data: {
                status: response.status,
                error: errorData,
                permissions: 'Friends API not accessible'
              },
              message: 'Friends API test failed - may need user_friends permission'
            });
          }
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: `Friends test failed: ${error.message}`
          }, { status: 500 });
        }

      case 'profile':
        if (!FACEBOOK_USER_TOKEN) {
          return NextResponse.json({
            success: false,
            message: 'Facebook USER token not configured'
          }, { status: 400 });
        }

        // Test user profile with friends count
        try {
          const response = await fetch(
            `${FACEBOOK_API_URL}/me?fields=id,name,email,friends.limit(0).summary(true)&access_token=${FACEBOOK_USER_TOKEN}`
          );

          if (response.ok) {
            const userData = await response.json();
            const friendsCount = userData.friends?.summary?.total_count || 0;
            
            return NextResponse.json({
              success: true,
              data: {
                userId: userData.id,
                userName: userData.name,
                userEmail: userData.email,
                friendsCount: friendsCount,
                estimatedConversations: Math.floor(friendsCount * 0.7),
                estimatedMessages: Math.floor(friendsCount * 25),
                hasProfileAccess: true
              },
              message: `Profile accessible: ${userData.name} with ${friendsCount} friends`
            });
          } else {
            const errorData = await response.text();
            return NextResponse.json({
              success: false,
              data: {
                status: response.status,
                error: errorData
              },
              message: 'Profile API test failed'
            }, { status: 400 });
          }
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: `Profile test failed: ${error.message}`
          }, { status: 500 });
        }

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid test type. Use: config, conversations, friends, or profile'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Messenger test error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Test failed'
    }, { status: 500 });
  }
}