import { Parallax, ParallaxLayer } from "@react-spring/parallax"

export default function LandingPage2() {

    return (
        <Parallax pages={1} style={{ top: '0', left: '0' }}>
            <ParallaxLayer offset={0} speed={2.5}>
                <p>Parallax</p>
            </ParallaxLayer>
        </Parallax>
    )
}