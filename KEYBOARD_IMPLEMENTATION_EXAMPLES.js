/**
 * ============================================
 * KEYBOARD RESPONSIVENESS - IMPLEMENTATION EXAMPLES
 * ============================================
 *
 * Copy-paste examples for common screen patterns
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Button,
  FlatList,
} from 'react-native';
import KeyboardAwareScrollView from './src/components/KeyboardAwareScrollView';
import KeyboardAwareFlatList from './src/components/KeyboardAwareFlatList';
import FormDropdown from './src/components/FormDropdown';

// ============================================
// EXAMPLE 1: ListYourCarScreen (Full Form)
// ============================================

export const ListYourCarScreenExample = ({ navigation }) => {
  const [carName, setCarName] = useState('');
  const [price, setPrice] = useState('');
  const [transmission, setTransmission] = useState(null);
  const [fuelType, setFuelType] = useState(null);
  const [seats, setSeats] = useState('');

  const handleSubmit = () => {
    // Submit logic
  };

  return (
    <KeyboardAwareScrollView>
      <View style={styles.formContainer}>
        <Text style={styles.title}>List Your Car</Text>

        {/* Text Inputs - Auto move up with keyboard */}
        <TextInput
          style={styles.input}
          placeholder="Car Name *"
          value={carName}
          onChangeText={setCarName}
        />

        <TextInput
          style={styles.input}
          placeholder="Rent Per Day *"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        {/* Dropdowns - Accessible above keyboard */}
        <FormDropdown
          label="Transmission Type"
          value={transmission}
          onSelect={setTransmission}
          options={[
            { label: 'Automatic', value: 'Automatic' },
            { label: 'Manual', value: 'Manual' },
          ]}
          placeholder="Select transmission"
        />

        <FormDropdown
          label="Fuel Type"
          value={fuelType}
          onSelect={setFuelType}
          options={[
            { label: 'Petrol', value: 'Petrol' },
            { label: 'Diesel', value: 'Diesel' },
            { label: 'Electric', value: 'Electric' },
          ]}
          placeholder="Select fuel type"
        />

        <TextInput
          style={styles.input}
          placeholder="Number of Seats"
          keyboardType="numeric"
          value={seats}
          onChangeText={setSeats}
        />

        {/* Image Upload - Visible above keyboard */}
        <View style={styles.uploadSection}>
          <Text style={styles.label}>Upload Car Images</Text>
          <TouchableOpacity style={styles.uploadButton}>
            <Image
              source={require('./assets/Icons/camera.png')}
              style={styles.uploadIcon}
            />
            <Text>Add Photos</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button - Always accessible */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

// ============================================
// EXAMPLE 2: ChatScreen (Messages + Input)
// ============================================

export const ChatScreenExample = ({ route }) => {
  const { bookingId } = route.params;
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello!', sender: 'user' },
    { id: '2', text: 'Hi there!', sender: 'owner' },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim()) {
      setMessages([...messages, {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
      }]);
      setInputText('');
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userMessage : styles.ownerMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.chatContainer}>
      {/* Use KeyboardAwareFlatList for chat */}
      <KeyboardAwareFlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted={false}
        contentContainerStyle={styles.messagesList}
      />

      {/* Input stays visible above keyboard */}
      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================
// EXAMPLE 3: EditProfileScreen (Multiple Inputs)
// ============================================

export const EditProfileScreenExample = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');

  return (
    <KeyboardAwareScrollView>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Edit Profile</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter your address"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

// ============================================
// EXAMPLE 4: SearchScreen (Search + Filters)
// ============================================

export const SearchScreenExample = () => {
  const [searchText, setSearchText] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [fuelType, setFuelType] = useState('');

  return (
    <KeyboardAwareScrollView>
      <View style={styles.formContainer}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Image
            source={require('./assets/Icons/search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cars..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Filters */}
        <Text style={styles.sectionTitle}>Filters</Text>

        <View style={styles.priceRow}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Min Price"
            keyboardType="numeric"
            value={minPrice}
            onChangeText={setMinPrice}
          />

          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Max Price"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
          />
        </View>

        <FormDropdown
          label="Fuel Type"
          value={fuelType}
          onSelect={setFuelType}
          options={[
            { label: 'All', value: '' },
            { label: 'Petrol', value: 'Petrol' },
            { label: 'Diesel', value: 'Diesel' },
          ]}
          placeholder="Select fuel type"
        />

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

// ============================================
// EXAMPLE 5: LoginScreen (Simple Form)
// ============================================

export const LoginScreenExample = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAwareScrollView>
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

// ============================================
// EXAMPLE 6: BookingScreen (Multi-section Form)
// ============================================

export const BookingScreenExample = () => {
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <KeyboardAwareScrollView>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Book Vehicle</Text>

        {/* Date Selection */}
        <Text style={styles.sectionTitle}>Booking Details</Text>

        <TextInput
          style={styles.input}
          placeholder="Pickup Date"
          value={pickupDate}
          onChangeText={setPickupDate}
        />

        <TextInput
          style={styles.input}
          placeholder="Return Date"
          value={returnDate}
          onChangeText={setReturnDate}
        />

        <TextInput
          style={styles.input}
          placeholder="Pickup Time"
          value={pickupTime}
          onChangeText={setPickupTime}
        />

        {/* Additional Notes */}
        <Text style={styles.sectionTitle}>Additional Notes</Text>

        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Any special requests?"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Containers
  formContainer: {
    padding: 16,
  },
  loginContainer: {
    padding: 16,
    justifyContent: 'center',
    minHeight: '100%',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Typography
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#666',
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  // Price Row
  priceRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  // Upload
  uploadSection: {
    marginBottom: 16,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderStyle: 'dashed',
    backgroundColor: '#f9f9f9',
  },
  uploadIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
    tintColor: '#666',
  },

  // Buttons
  submitButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#4A90E2',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },

  // Chat
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
  },
  ownerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

/**
 * ============================================
 * MIGRATION STEPS
 * ============================================
 *
 * For any existing screen:
 *
 * 1. Import KeyboardAwareScrollView:
 *    import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';
 *
 * 2. Replace the outer container:
 *    <ScrollView> → <KeyboardAwareScrollView>
 *    <View> → <KeyboardAwareScrollView>
 *
 * 3. That's it! No other changes needed.
 *
 * ============================================
 * BENEFITS
 * ============================================
 *
 * ✅ All inputs move up with keyboard
 * ✅ Dropdowns accessible
 * ✅ Image uploads visible
 * ✅ Works on iOS & Android
 * ✅ Auto-scroll to focused element
 * ✅ Dismiss keyboard on outside tap
 * ✅ No UI changes
 * ✅ Production-ready
 */
