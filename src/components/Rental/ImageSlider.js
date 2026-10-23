import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('screen'); // ✅ also get height

const ImageSlider = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const scrollViewRef = useRef(null);

    const slides = [
        { id: 1, image: require('../../assets/Images/sliderCar.png') },
        { id: 2, image: require('../../assets/Images/sliderCar.png') },
        { id: 3, image: require('../../assets/Images/sliderCar.png') },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            const nextSlide = (activeSlide + 1) % slides.length;
            setActiveSlide(nextSlide);
            scrollViewRef.current?.scrollTo({
                x: nextSlide * width,
                animated: true,
            });
        }, 3000);
        return () => clearInterval(timer);
    }, [activeSlide]);

    const onScrollEnd = (event) => {
        const slide = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveSlide(slide);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={width}
                snapToAlignment="start"
                bounces={false}
                overScrollMode="never"
                style={styles.scrollView}
            >
                {slides.map((slide) => (
                    <View key={slide.id} style={styles.slide}>
                        <Image
                            source={slide.image}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>
                ))}
            </ScrollView>

            <View style={styles.pagination}>
                {slides.map((_, index) =>
                    activeSlide === index ? (
                        <LinearGradient
                            key={index}
                            colors={['#141248', '#63C8FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.dot, styles.activeDot]}
                        />
                    ) : (
                        <View key={index} style={[styles.dot, styles.inactiveDot]} />
                    )
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 200,
        marginBottom: -20,
        // ✅ Responsive top margin (5% of screen height)
        marginTop: height * -0.03, // Adjust -0.02 or -0.04 as needed
        position: 'relative',
    },
    scrollView: {
        height: 180,
        width: '100%',
    },
    slide: {
        width: width,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width - 30,
        height: 120,
        borderRadius: 15,
    },
    pagination: {
        position: 'absolute',
        bottom: 30,
        right: 50,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        width: 40,
        height: 10,
        borderRadius: 15,
    },
    inactiveDot: {
        width: 15,
        backgroundColor: '#C4C4C4',
    },
});

export default ImageSlider;
