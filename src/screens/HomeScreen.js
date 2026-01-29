// HomeScreen.js

import React from 'react';
import { View, Text, Button } from 'react-native';
import { normalize } from 'emotion-normalize';

const HomeScreen = () => {
    return (
        <View>
            <Text>Today's Workout Preview</Text>
            {/* Display workout details */}
            <Button title="Get Started!" onPress={() => { /* Handle CTA */ }} />
        </View>
    );
};

export default HomeScreen;