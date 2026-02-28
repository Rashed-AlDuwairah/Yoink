import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

function App(): React.JSX.Element {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    if (!url) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatus('Fetching video info...');

    try {
      // 1. Get video URL from Cobalt API
      const cobaltApi = 'https://api.cobalt.tools/api/json';
      const response = await fetch(cobaltApi, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from Cobalt API');
      }

      const result = await response.json();
      const videoUrl = result.url;

      if (!videoUrl) {
        throw new Error('Could not find video URL in response');
      }

      // 2. Download video to local storage
      setStatus('Downloading video...');
      const fileName = `yoink_${Date.now()}.mp4`;
      const destPath = `${RNFS.TemporaryDirectoryPath}${fileName}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: videoUrl,
        toFile: destPath,
        progress: (res) => {
          const percentage = (res.bytesWritten / res.contentLength) * 100;
          setProgress(Math.round(percentage));
        },
        progressDivider: 10,
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error('Failed to download video file');
      }

      // 3. Save to Photos
      setStatus('Saving to Photos...');
      await CameraRoll.save(destPath, { type: 'video' });

      // Clean up temporary file
      await RNFS.unlink(destPath);

      setStatus('Success! Video saved to your photos.');
      Alert.alert('Success', 'Video saved to your photos!');
      setUrl('');
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Yoink</Text>
        <Text style={styles.subtitle}>No-watermark Video Downloader</Text>

        <TextInput
          style={styles.input}
          placeholder="Paste TikTok, IG, or Twitter URL here"
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleDownload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Download</Text>
          )}
        </TouchableOpacity>

        {loading && progress > 0 && (
          <Text style={styles.progressText}>{progress}% Downloaded</Text>
        )}

        <Text style={styles.statusText}>{status}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    color: '#000',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#78A9FF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  progressText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default App;
