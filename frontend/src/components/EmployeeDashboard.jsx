import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import api from '../api';

const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in m
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
};

const EmployeeDashboard = () => {
    const [status, setStatus] = useState('Checking location...');
    const [inZone, setInZone] = useState(false);
    const [location, setLocation] = useState(null);
    const [zone, setZone] = useState(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/', { replace: true });
    };

    useEffect(() => {
        loadZone();
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation({ lat: latitude, lng: longitude });
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        if (location && zone) {
            const dist = getDistanceFromLatLonInM(location.lat, location.lng, zone.center.lat, zone.center.lng);
            if (dist <= zone.radius) {
                setStatus('You are in the zone');
                setInZone(true);
            } else {
                setStatus(`Out of zone (Dist: ${Math.round(dist)}m)`);
                setInZone(false);
            }
        }
    }, [location, zone]);

    const loadZone = async () => {
        try {
            const res = await api.get('/zone');
            if (res.data) setZone(res.data);
        } catch (err) {
            console.error('Error loading zone');
        }
    };

    const startCamera = async () => {
        setCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Camera access denied');
        }
    };

    // Compress image by reducing quality and size
    const compressImage = (dataUrl, maxWidth = 480, quality = 0.5) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Convert to JPEG with reduced quality (0.5 = 50% quality)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

                // Log size comparison
                const originalSize = Math.round(dataUrl.length * 0.75 / 1024);
                const compressedSize = Math.round(compressedDataUrl.length * 0.75 / 1024);
                console.log(`Image compressed: ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize / originalSize) * 100)}% smaller)`);

                resolve(compressedDataUrl);
            };
            img.src = dataUrl;
        });
    };

    const capturePhoto = async () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, 320, 240);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);

            // Compress the image before saving
            const compressedImage = await compressImage(dataUrl);
            setCapturedImage(compressedImage);

            // Stop camera
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            setCameraOpen(false);
        }
    };

    const handleCheckIn = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return alert('Not logged in');

        try {
            await api.post('/checkin', {
                userId: user.id, // Changed from user._id to user.id for Supabase
                coords: location,
                photo: capturedImage,
                status: inZone ? 'in_zone' : 'out_of_zone'
            });
            alert(inZone ? 'Check-in successful!' : 'Check-in recorded (Out of zone)');
            setCapturedImage(null);
        } catch (err) {
            console.error('Check-in error:', err);
            alert('Check-in failed: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0 }}>Employee Dashboard</h1>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.5rem 1rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    <LogOut size={16} style={{ marginRight: '6px' }} /> Logout
                </button>
            </div>

            <div style={{ background: inZone ? '#d4edda' : '#f8d7da', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                <h2 style={{ color: inZone ? '#155724' : '#721c24' }}>{status}</h2>
                {location && <p>Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}</p>}
            </div>

            <div style={{ textAlign: 'center' }}>
                {!cameraOpen && !capturedImage && (
                    <button onClick={startCamera} style={{ padding: '0.75rem 2rem', fontSize: '1rem', cursor: 'pointer' }}>
                        Open Camera
                    </button>
                )}

                {cameraOpen && (
                    <div>
                        <video ref={videoRef} autoPlay style={{ width: '100%', maxWidth: '320px', borderRadius: '8px' }}></video>
                        <br />
                        <button onClick={capturePhoto} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Capture
                        </button>
                    </div>
                )}

                {capturedImage && (
                    <div>
                        <h3>Preview</h3>
                        <img src={capturedImage} alt="Capture" style={{ width: '100%', maxWidth: '320px', borderRadius: '8px' }} />
                        <br />
                        <button onClick={handleCheckIn} style={{ marginTop: '1rem', padding: '0.75rem 2rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' }}>
                            Submit Check-In
                        </button>
                        <button onClick={() => setCapturedImage(null)} style={{ marginLeft: '1rem', padding: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'red' }}>
                            Retake
                        </button>
                    </div>
                )}

                <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }}></canvas>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
