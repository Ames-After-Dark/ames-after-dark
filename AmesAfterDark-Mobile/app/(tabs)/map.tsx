
import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useMapLocations } from '@/hooks/useMapLocations';

export default function MapScreen() {
  const { locations, isLoading, error } = useMapLocations();

  const renderMapContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.infoText}>Loading Locations...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        initialRegion={{
          // Centered on Ames, IA
          latitude: 42.03,
          longitude: -93.63,
          latitudeDelta: 0.1,
          longitudeDelta: 0.05,
        }}
        showsPointsOfInterest={
          false // This is how to remove the pre-set pins on apple / google maps -- can set to true or false
        }
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={location.name}
          />
        ))}
      </MapView>
    );
  };

  return (

    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {renderMapContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    padding: 16,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#11181C',
  },
  infoText: {
    marginTop: 8,
    fontSize: 16,
    color: '#687076',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


// import React from 'react';
// import { StyleSheet, View, Text, ActivityIndicator, Image } from 'react-native';
// import MapView, { Marker } from 'react-native-maps';
// import { useMapLocations } from '@/hooks/useMapLocations';
// import ParallaxScrollView from '@/components/parallax-scroll-view';
//
// export default function MapScreen() {
//   const { locations, isLoading, error } = useMapLocations();
//
//   const renderMapContent = () => {
//     if (isLoading) {
//       return (
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" />
//           <Text style={styles.infoText}>Loading Locations...</Text>
//         </View>
//       );
//     }
//
//     if (error) {
//       return (
//         <View style={styles.centered}>
//           <Text style={styles.errorText}>Error: {error}</Text>
//         </View>
//       );
//     }
//
//     return (
//       <MapView
//         style={styles.map}
//         initialRegion={{
//             // Centered on Ames, IA
//             latitude: 42.03,
//             longitude: -93.63,
//             latitudeDelta: 0.1,
//             longitudeDelta: 0.05,
//         }}
//         showsPointsOfInterest={
//             false // This is how to remove the pre-set pins on apple / google maps -- can set to true or false
//         }
//       >
//         {locations.map((location) => (
//           <Marker
//             key={location.id}
//             coordinate={{ latitude: location.latitude, longitude: location.longitude }}
//             title={location.name}
//           />
//         ))}
//       </MapView>
//     );
//   };
//
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: '#153940', dark: '#153940' }}
//       headerImage={
//         <Image
//           source={require('@/assets/images/Logo.png')}
//           style={styles.logo}
//           resizeMode="contain"
//         />
//       }
//     >
//       <View style={styles.titleContainer}>
//         <Text style={styles.titleText}>Map</Text>
//       </View>
//
//       <View style={styles.mapContainer}>
//         {renderMapContent()}
//       </View>
//     </ParallaxScrollView>
//   );
// }
//
// const styles = StyleSheet.create({
//   titleContainer: {
//     paddingHorizontal: 16,
//     gap: 8,
//   },
//   titleText: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: '#ffffff', // Hardcoded color - should update to use theme
//   },
//   infoText: {
//     marginTop: 8,
//     fontSize: 16,
//     color: '#687076',
//   },
//   errorText: {
//     color: 'red',
//     fontSize: 16,
//   },
//   mapContainer: {
//     height: 500,
//     width: '100%',
//     marginTop: 16,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   centered: {
//     flex: 1,
//     height: 500,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   logo: {
//     width: '100%',
//     height: '100%',
//     alignSelf: 'center',
//   },
// });
