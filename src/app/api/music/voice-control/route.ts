import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_OPTIONS } from '@/lib/auth';
// Simple storage interface for music data
interface SimpleStorage {
  getToken(key: string): Promise<string | null>;
  storeToken(key: string, value: string): Promise<void>;
}

class LocalMusicStorage implements SimpleStorage {
  private data: Map<string, string> = new Map();
  
  async getToken(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }
  
  async storeToken(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }
}

const musicStorage = new LocalMusicStorage();

interface VoiceCommand {
  action: 'parse_command' | 'execute_command';
  transcript: string;
  context?: {
    currentSong?: string;
    isPlaying?: boolean;
    volume?: number;
    currentPlaylist?: string[];
  };
}

interface MusicCommand {
  type: 'play' | 'pause' | 'stop' | 'next' | 'previous' | 'volume' | 'search' | 'playlist' | 'like' | 'shuffle' | 'repeat';
  parameters?: {
    query?: string;
    volume?: number;
    playlistName?: string;
    songTitle?: string;
    artist?: string;
    action?: string;
  };
  confidence: number;
  intent: string;
}

class VoiceMusicParser {
  private static patterns = {
    play: [
      /(?:play|start|begin)\s*(?:song|music|track)?\s*(.+)?/i,
      /(?:put on|listen to)\s*(.+)/i,
      /^play$/i
    ],
    pause: [
      /(?:pause|stop)\s*(?:the\s*)?(?:music|song|track)?/i,
      /^pause$/i,
      /^stop$/i
    ],
    next: [
      /(?:next|skip)\s*(?:song|track)?/i,
      /(?:play\s*)?(?:the\s*)?next\s*(?:song|track)?/i,
      /^next$/i,
      /^skip$/i
    ],
    previous: [
      /(?:previous|prev|back)\s*(?:song|track)?/i,
      /(?:play\s*)?(?:the\s*)?(?:previous|last)\s*(?:song|track)?/i,
      /^previous$/i,
      /^back$/i
    ],
    volume: [
      /(?:set\s*)?volume\s*(?:to\s*)?(\d+)(?:%|\s*percent)?/i,
      /(?:turn|make)\s*(?:the\s*)?(?:volume|music)\s*(up|down|louder|quieter)/i,
      /(?:increase|decrease|raise|lower)\s*(?:the\s*)?volume/i,
      /(?:mute|unmute)/i
    ],
    search: [
      /(?:search|find|look for)\s*(?:song|music|track)?\s*(.+)/i,
      /(?:play\s*)?(?:some\s*)?(.+)\s*(?:by|from)\s*(.+)/i
    ],
    playlist: [
      /(?:play|start)\s*(?:playlist|list)\s*(.+)/i,
      /(?:create|make)\s*(?:a\s*)?(?:new\s*)?playlist\s*(?:called|named)?\s*(.+)/i,
      /(?:add\s*)?(?:this\s*)?(?:song|track)\s*to\s*(?:playlist\s*)?(.+)/i
    ],
    like: [
      /(?:like|love|favorite)\s*(?:this\s*)?(?:song|track)?/i,
      /(?:add\s*)?(?:this\s*)?(?:song|track)?\s*to\s*(?:my\s*)?(?:favorites|liked)/i,
      /(?:unlike|remove from favorites)\s*(?:this\s*)?(?:song|track)?/i
    ],
    shuffle: [
      /(?:turn\s*)?(?:on|off|enable|disable)\s*shuffle/i,
      /shuffle\s*(?:on|off|mode)?/i,
      /(?:randomize|random)\s*(?:play|playback)?/i
    ],
    repeat: [
      /(?:turn\s*)?(?:on|off|enable|disable)\s*repeat/i,
      /repeat\s*(?:on|off|one|all|mode)?/i,
      /(?:loop|replay)\s*(?:song|track|playlist)?/i
    ]
  };

  static parseCommand(transcript: string): MusicCommand | null {
    const normalizedText = transcript.toLowerCase().trim();
    
    for (const [commandType, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const match = normalizedText.match(pattern);
        if (match) {
          return this.buildCommand(commandType as any, match, normalizedText);
        }
      }
    }
    
    return null;
  }

  private static buildCommand(type: MusicCommand['type'], match: RegExpMatchArray, fullText: string): MusicCommand {
    const command: MusicCommand = {
      type,
      confidence: 0.8,
      intent: fullText,
      parameters: {}
    };

    switch (type) {
      case 'play':
        if (match[1] && match[1].trim()) {
          // Extract song/artist information
          const query = match[1].trim();
          const byMatch = query.match(/(.+)\s+by\s+(.+)/i);
          
          if (byMatch) {
            command.parameters!.songTitle = byMatch[1].trim();
            command.parameters!.artist = byMatch[2].trim();
            command.parameters!.query = `${byMatch[1]} ${byMatch[2]}`;
          } else {
            command.parameters!.query = query;
          }
          command.confidence = 0.9;
        } else {
          command.confidence = 0.7; // Generic play command
        }
        break;

      case 'volume':
        if (match[1]) {
          const volumeLevel = parseInt(match[1]);
          if (!isNaN(volumeLevel) && volumeLevel >= 0 && volumeLevel <= 100) {
            command.parameters!.volume = volumeLevel;
            command.confidence = 0.95;
          }
        } else if (fullText.includes('up') || fullText.includes('louder')) {
          command.parameters!.action = 'increase';
          command.confidence = 0.85;
        } else if (fullText.includes('down') || fullText.includes('quieter')) {
          command.parameters!.action = 'decrease';
          command.confidence = 0.85;
        } else if (fullText.includes('mute')) {
          command.parameters!.volume = 0;
          command.confidence = 0.9;
        }
        break;

      case 'search':
        if (match[1] && match[2]) {
          // "play [song] by [artist]" format
          command.parameters!.songTitle = match[1].trim();
          command.parameters!.artist = match[2].trim();
          command.parameters!.query = `${match[1]} ${match[2]}`;
          command.confidence = 0.9;
        } else if (match[1]) {
          command.parameters!.query = match[1].trim();
          command.confidence = 0.8;
        }
        break;

      case 'playlist':
        if (match[1] && match[1].trim()) {
          command.parameters!.playlistName = match[1].trim();
          
          if (fullText.includes('create') || fullText.includes('make')) {
            command.parameters!.action = 'create';
          } else if (fullText.includes('add')) {
            command.parameters!.action = 'add_song';
          } else {
            command.parameters!.action = 'play';
          }
          command.confidence = 0.85;
        }
        break;

      case 'shuffle':
        if (fullText.includes('off') || fullText.includes('disable')) {
          command.parameters!.action = 'off';
        } else {
          command.parameters!.action = 'on';
        }
        command.confidence = 0.9;
        break;

      case 'repeat':
        if (fullText.includes('off') || fullText.includes('disable')) {
          command.parameters!.action = 'off';
        } else if (fullText.includes('one') || fullText.includes('song')) {
          command.parameters!.action = 'one';
        } else {
          command.parameters!.action = 'all';
        }
        command.confidence = 0.9;
        break;

      default:
        command.confidence = 0.8;
    }

    return command;
  }

  static getHelpText(): string[] {
    return [
      "🎵 Music Voice Commands:",
      "• \"Play [song name]\" - Play a specific song",
      "• \"Play [song] by [artist]\" - Play song by specific artist", 
      "• \"Pause\" or \"Stop\" - Pause playback",
      "• \"Next\" or \"Skip\" - Play next song",
      "• \"Previous\" or \"Back\" - Play previous song",
      "• \"Volume [0-100]\" - Set volume level",
      "• \"Volume up/down\" - Adjust volume",
      "• \"Search [query]\" - Search for music",
      "• \"Play playlist [name]\" - Play specific playlist",
      "• \"Like this song\" - Add to favorites",
      "• \"Shuffle on/off\" - Toggle shuffle mode",
      "• \"Repeat on/off/one\" - Set repeat mode"
    ];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const token = request.cookies.get(COOKIE_OPTIONS.name)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = verifyToken(token);
    const body: VoiceCommand = await request.json();
    
    console.log('Voice Music Control request:', body);

    if (!body.action || !body.transcript) {
      return NextResponse.json(
        { success: false, message: 'Action and transcript are required' },
        { status: 400 }
      );
    }

    let result: any = null;

    switch (body.action) {
      case 'parse_command':
        const parsedCommand = VoiceMusicParser.parseCommand(body.transcript);
        
        if (!parsedCommand) {
          result = {
            recognized: false,
            message: "I didn't understand that music command. Try saying things like 'play music', 'next song', or 'volume up'.",
            suggestions: VoiceMusicParser.getHelpText(),
            originalTranscript: body.transcript
          };
        } else {
          result = {
            recognized: true,
            command: parsedCommand,
            message: `I understood: ${parsedCommand.intent}`,
            originalTranscript: body.transcript,
            confidence: parsedCommand.confidence
          };
        }
        break;

      case 'execute_command':
        const commandToExecute = VoiceMusicParser.parseCommand(body.transcript);
        
        if (!commandToExecute) {
          return NextResponse.json({
            success: false,
            message: "Could not understand the music command",
            suggestions: VoiceMusicParser.getHelpText()
          });
        }

        // Execute the parsed command
        result = await executeVoiceCommand(commandToExecute, body.context, user.id);
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Voice Music Control error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process voice command'
      },
      { status: 500 }
    );
  }
}

async function executeVoiceCommand(command: MusicCommand, context: any, userId: string) {
  const storage = musicStorage;
  
  switch (command.type) {
    case 'play':
      if (command.parameters?.query) {
        // Search for the song/artist
        const searchResponse = await fetch('/api/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'search',
            query: command.parameters.query,
            platform: 'both',
            limit: 5
          })
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const tracks = searchData.data?.tracks || [];
          
          if (tracks.length > 0) {
            return {
              action: 'play_song',
              song: tracks[0],
              message: `Playing "${tracks[0].title}" by ${tracks[0].artist}`,
              alternatives: tracks.slice(1, 3)
            };
          } else {
            return {
              action: 'search_failed',
              message: `Sorry, I couldn't find "${command.parameters.query}". Try a different search term.`,
              query: command.parameters.query
            };
          }
        }
      } else {
        // Resume playback
        return {
          action: 'resume_playback',
          message: 'Resuming playback'
        };
      }
      break;

    case 'pause':
      return {
        action: 'pause_playback',
        message: 'Pausing playback'
      };

    case 'next':
      return {
        action: 'next_song',
        message: 'Playing next song'
      };

    case 'previous':
      return {
        action: 'previous_song',
        message: 'Playing previous song'
      };

    case 'volume':
      if (command.parameters?.volume !== undefined) {
        return {
          action: 'set_volume',
          volume: command.parameters.volume,
          message: `Setting volume to ${command.parameters.volume}%`
        };
      } else if (command.parameters?.action === 'increase') {
        return {
          action: 'volume_up',
          message: 'Turning volume up'
        };
      } else if (command.parameters?.action === 'decrease') {
        return {
          action: 'volume_down',
          message: 'Turning volume down'
        };
      }
      break;

    case 'shuffle':
      return {
        action: 'toggle_shuffle',
        enabled: command.parameters?.action === 'on',
        message: `Shuffle ${command.parameters?.action === 'on' ? 'enabled' : 'disabled'}`
      };

    case 'repeat':
      const repeatMode = command.parameters?.action || 'all';
      return {
        action: 'set_repeat',
        mode: repeatMode,
        message: `Repeat ${repeatMode === 'off' ? 'disabled' : `set to ${repeatMode}`}`
      };

    case 'like':
      if (context?.currentSong) {
        return {
          action: 'toggle_like',
          songId: context.currentSong,
          message: 'Added to favorites'
        };
      } else {
        return {
          action: 'no_song',
          message: 'No song is currently playing to like'
        };
      }

    case 'playlist':
      if (command.parameters?.action === 'create' && command.parameters?.playlistName) {
        return {
          action: 'create_playlist',
          playlistName: command.parameters.playlistName,
          message: `Creating playlist "${command.parameters.playlistName}"`
        };
      } else if (command.parameters?.action === 'play' && command.parameters?.playlistName) {
        return {
          action: 'play_playlist',
          playlistName: command.parameters.playlistName,
          message: `Playing playlist "${command.parameters.playlistName}"`
        };
      }
      break;

    default:
      return {
        action: 'unknown',
        message: 'I understand the command but cannot execute it right now',
        command: command.type
      };
  }

  return {
    action: 'error',
    message: 'Could not execute the command',
    command
  };
}

export async function GET(request: NextRequest) {
  try {
    const result = {
      supportedCommands: Object.keys(VoiceMusicParser['patterns']),
      helpText: VoiceMusicParser.getHelpText(),
      examples: [
        "Play Bohemian Rhapsody",
        "Play music by Queen",
        "Next song",
        "Volume 50",
        "Shuffle on",
        "Create playlist My Favorites",
        "Like this song"
      ]
    };

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Voice Music Control GET error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get voice commands info'
      },
      { status: 500 }
    );
  }
}