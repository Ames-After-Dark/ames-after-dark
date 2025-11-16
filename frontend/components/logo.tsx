import { Image } from 'react-native'

export default function Logo() {
    return <Image
        style={{ width: 300, height: 300 }}
        source={require('@/assets/images/ames-after-dark-splash-screen.png')}
    />
}