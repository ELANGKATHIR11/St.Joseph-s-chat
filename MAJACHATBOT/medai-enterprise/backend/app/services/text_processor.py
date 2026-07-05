import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from textblob import TextBlob

# Ensure the required NLTK data is downloaded
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('tokenizers/punkt_tab')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('punkt_tab')
    nltk.download('stopwords')
    nltk.download('averaged_perceptron_tagger')

stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

def preprocess_text(text: str) -> str:
    """
    Applies the preprocessing pipeline from the Kaggle medical chatbot notebook:
    1. Lowercase
    2. Remove noise (HTML tags, non-word characters)
    3. Tokenize & Remove Stopwords
    4. Porter Stemmer
    5. Spell check with TextBlob
    """
    # 1. Lowercase
    text = str(text).lower()
    
    # 2. Remove Noise
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    
    # 3. Tokenize & Remove Stopwords
    words = word_tokenize(text)
    filtered_words = [word for word in words if word not in stop_words]
    
    # 4. Porter Stemmer
    stemmed_words = [stemmer.stem(word) for word in filtered_words]
    stemmed_text = ' '.join(stemmed_words)
    
    # 5. Spell Check
    blob = TextBlob(stemmed_text)
    corrected_text = str(blob.correct())
    
    return corrected_text
