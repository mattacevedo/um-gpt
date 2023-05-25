import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from 'next/router';



export default function Home() {

  // verify request comes from miami.edu
  const router = useRouter();

  useEffect(() => {
    if (router.isFallback) return;

    if (router.query.validReferrer !== 'true') {
      router.push('https://miami.edu');
      return;
    }
  }, [router]);

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi there! I'm UM-GPT, a secure version of ChatGPT for University of Miami faculty, staff, and students. Conversations with me are not permanently stored or used to train future systems. How can I help you?" }
  ]);

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current.focus();
  }, []);

    // Refocus on the input field after a new message is added
    useEffect(() => {
    textAreaRef.current.focus();
  }, [messages]);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: "There's been an error. Make sure the API key is set up correctly and try again." }]);
    setLoading(false);
    setUserInput("");
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    const context = [...messages, { role: "user", content: userInput }];
    setMessages(context);

    // Send chat history to API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: context }),
    });

    if (!response.ok) {
      handleError();
      return;
    }

    // Reset user input
    setUserInput("");

    const data = await response.json();

    setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: data.result.content }]);
    setLoading(false);

  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <>
      <Head>
        <title>UM-GPT</title>
        <meta name="description" content="UM-GPT" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
        <div className={styles.navlogo}>
          <Image src="/UM-logo.png" alt="UM Logo" width="105" height="60" className={styles.boticon} priority={true} />
        </div>
        <div className={styles.navlinks}>
         
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {messages.map((message, index) => {
              return (
                // The latest message sent by the user will be animated while waiting for a response
                <div key={index} className={message.role === "user" && loading && index === messages.length - 1 ? styles.usermessagewaiting : message.role === "assistant" ? styles.apimessage : styles.usermessage}>
                  {/* Display the correct icon depending on the message type */}
                  {message.role === "assistant" ? <Image src="/openai.png" alt="AI" width="30" height="30" className={styles.boticon} priority={true} /> : <Image src="/usericon.png" alt="Me" width="30" height="30" className={styles.usericon} priority={true} />}
                  <div className={styles.markdownanswer}>
                    {/* Messages are being rendered in Markdown format */}
                    <ReactMarkdown linkTarget={"_blank"}>{message.content}</ReactMarkdown>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className={styles.center}>

          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                type="text"
                id="userInput"
                name="userInput"
                placeholder={loading ? "Waiting for response..." : "Type your question..."}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                className={styles.textarea}
              />
              <button
                type="submit"
                disabled={loading}
                className={styles.generatebutton}
              >
                {loading ? <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20} /> </div> :
                  // Send icon SVG in input field
                  <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                  </svg>}
              </button>
            </form>
          </div>
          <div className={styles.footer}>
            <p>©2023 University of Miami. All rights reserved.<br />
            <a href="https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" target="_blank">Data, Privacy, and Security for Azure OpenAI Service</a></p>
          </div>
        </div>
      </main>
    </>
  )
}

export async function getServerSideProps(context) {
  const referrer = context.req.headers.referer || '';

  if (referrer.includes('miami.edu')) {
    return { props: { validReferrer: 'true' } };
  } else {
    return { props: { validReferrer: 'false' } };
  }
}