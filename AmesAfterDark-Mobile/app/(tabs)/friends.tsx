import { View, Text, Image, StyleSheet } from 'react-native';

export default function Friends() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>Friends</Text>
      
      <Image
        source={require('../../assets/images/Logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  title: {
    color: '#eaeafb',
    fontSize: 28,
    fontWeight: '700',
  },
});
