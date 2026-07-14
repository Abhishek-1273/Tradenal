import React from 'react';
import {
  Modal, View, TouchableOpacity, StyleSheet,
  Dimensions, Image, Platform, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUrl,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Tap background to close */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />

        {/* Full screen Image */}
        <View style={styles.imageContainer} pointerEvents="none">
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, { top: Platform.OS === 'ios' ? insets.top + 10 : 30 }]}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContainer: {
    width: SW,
    height: SH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
