import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import "./styles.css";
import { RecoilRoot } from "recoil";
import * as ed2curve from "ed2curve";
import * as bs58 from "bs58";
import { encrypt, decrypt, nonce } from "solana-encryption";

function App() {
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    sendData(data);
  }; // your form submit function which will invoke after successful validation

  const sendData = async (data) => {
    try {
      // console.log(data);

      const publicKeyA = process.env.REACT_APP_TASK_SENDER_PUBLIC_KEY;
      const privateKeyAString = process.env.REACT_APP_TASK_SENDER_PRIVATE_KEY;
      const privateKeyA = new Uint8Array(privateKeyAString.split(',').map(Number));
      const publicKeyB = process.env.REACT_APP_TASK_CREATOR_PUBLIC_KEY;
      const privateKeyBString = process.env.REACT_APP_TASK_CREATOR_PRIVATE_KEY;
      const privateKeyB = new Uint8Array(privateKeyBString.split(',').map(Number));

      const curve25519PublicKeyA = ed2curve.convertPublicKey(
        bs58.decode(publicKeyA)
      );

      const curve25519PrivateKeyA = ed2curve.convertSecretKey(privateKeyA);
      const curve25519PublicKeyB = ed2curve.convertPublicKey(
        bs58.decode(publicKeyB)
      );
      const curve25519PrivateKeyB = ed2curve.convertSecretKey(privateKeyB);

      // const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const newNonce = nonce();

      const message = JSON.stringify(data);

      const encrypted = encrypt(
        message,
        newNonce,
        curve25519PublicKeyB,
        curve25519PrivateKeyA
      );
      setEncryptedMessage(encrypted);

      const decrypted = decrypt(
        encrypted,
        newNonce,
        curve25519PublicKeyA,
        curve25519PrivateKeyB
      );
      setDecryptedMessage(decrypted);


      const payload = {
        encrypted,
        newNonce,
        publicKey: publicKeyA,
      }

      console.log("payload to send ", payload)

      const response = await axios.post("http://192.168.2.41:10000/contact", {
        payload,
      });

      console.log(response);
    } catch (error) {
      console.error("Error posting data: ", error);
    }
  };

  return (
    <RecoilRoot>
      <h1>Contact Us</h1>
      <div style={{ "textAlign": "center", color: "white" }}>
        <div style={{'textAlign': '-webkit-center'}}>
          <h2>Encrypted message:</h2>
          <h2 style={{ maxWidth: "800px", wordWrap: "break-word" }}>{encryptedMessage}</h2>
          <h2>Decrypted message:</h2>
          <h2>{decryptedMessage}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Email</label>
        <input {...register("email", { required: true })} />
        {errors.email && <p>This field is required</p>}

        <label>Name</label>
        <input {...register("name", { required: true })} />
        {errors.name && <p>This field is required</p>}
        
        <label>Message</label>
        <textarea
          style={{
            width: "100%",
            height: "8em",
            boxSizing: "border-box",
            resize: "none",
            borderRadius: '4px',
            border: '1px solid white',
            padding: '10px 15px'
          }}
          {...register("message", {required: false})}
        ></textarea>
        <input type="submit" />
      </form>
    </RecoilRoot>
  );
}

//

export default App;