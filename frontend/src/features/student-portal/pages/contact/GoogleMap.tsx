import React from 'react';
import GoogleMapReact from 'google-map-react';
import { Styles } from './styles/contact';

type GoogleMapProps = {
    center?: {
        lat: number;
        lng: number;
    };
    zoom?: number;
};

type MarkerProps = {
    lat?: number;
    lng?: number;
    text: string;
};

const AnyReactComponent = ({ text }: MarkerProps) => <div>{text}</div>;

function GoogleMap({
    center = {
        lat: 40.696295,
        lng: -73.997619
    },
    zoom = 11
}: GoogleMapProps) {
    return (
        <Styles>
            {/* Google Map */}
            <div className="google-map-area">
                <GoogleMapReact
                    bootstrapURLKeys={{ key: "AIzaSyATY4Rxc8jNvDpsK8ZetC7JyN4PFVYGCGM" }}
                    defaultCenter={center}
                    defaultZoom={zoom}
                >
                    <AnyReactComponent lat={40.696295} lng={-73.997619} text="My Marker" />
                </GoogleMapReact>
            </div>
        </Styles>
    )
}

export default GoogleMap
