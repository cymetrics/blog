---
title: "Why can I only reset the password when I forget it and the system couldn’t tell me my old password? "
date: 2022-02-21
tags: [Security]
author: huli
layout: en/layouts/post.njk
image: /img/posts/huli/reset-password/cover.jpeg
---

One day John was sorting out his “Favorite list”, and he found an online forum that he used to visit a lot, but he hasn’t logged in for more than a half year. He wanted to go back and see what was going on there, so he clicked into the forum, entered the account and password, and got a reply that the password was wrong. 

After several attempts, the system prompted John to use the “forgot password” function, so John filled in his email and then goes to the mailbox to receive the email and found a “reset password” link from the system. Although John successfully used the reset password to log in at the end, but there was a question that puzzled him, 

<!-- summary -->
“Why do you want me to reset my password instead of sending me the old password?” 

Many people might have the similar doubts like John. Wouldn't it be nice to send me the old password? Why force me to change it? 
<!-- summary -->
This question sounds simple but has many hidden concepts related to cybersecurity. Let us find out the answer to the question step by step and learn some basic cybersecurity knowledge along the way! 

As a reminder, although the first half of the paragraph may seem unrelated to the topic of the article, I promise you everything will be connected at the end. 

## The Stolen Database

You should often see news that the information of which website has been stolen again, and all the personal information of customers has been leaked out. For example, [GoDaddy](https://www.marketing-interactive.com/web-hosting-company-godaddy-leaks-wordpress-users-data), a well-known American web hosting company, has leaked 1.2 million user data, and [International Committee of the Red Cross (ICRC)](https://www.icrc.org/en/document/sophisticated-cyber-attack-targets-red-cross-red-crescent-data-500000-people) has also experienced the leakage of personal information from the cyberattacks. 

Here are two questions that I would like to discuss here: 

1. Is it really that easy to cause data leakage? 
2. What are the possible consequences of data leakage? 

Let's look at the first question first. There are many security loopholes that can lead to data leakage, and the attack vectors of some loopholes are a hundred times easier than you think. 

![Photo by Arget on Unsplash](/img/posts/huli/reset-password/p2.jpeg)

The hacker you imagine may be like the above, typing a lot of commands that you don’t know what to do, and there are many pictures with white characters on a black background or green characters on the screen. The website was knocked down eventually. 

In fact, some loopholes may be successfully attacked by changing a few words on the address bar, even if you don't know any coding. 

For example, let’s say there is an online shopping website. After you buy something, you send out an order. After the order is completed, you will be redirected to the order page. There are a lot of personal information on it, such as you name, delivery address, contact phone numbers and email, etc. 

Then you find that the URL of the order page is https://shop.huli.tw/orders?id=14597. 

It happens that your order number is also 14597. Driven by curiosity, you try to change the number to 14596 and press Enter. 

When the website is loaded, you can actually see the order number 14596 with the name, delivery address, contact number and email of a person you don't know. 

Some attacks are just that simple. As long as you change the word, you can see the information belonging to other people. At this time, if you know coding and programming, you can write a script to automatically capture the information whose id is 1 until the id is 15,000, and you will get the information of 15,000 orders on this shopping website, that is, the personal data of more than 10,000 customers. 

In this process, there is no picture with white characters on a black background, and there is no need to type frantically all the time. The only thing needed is to change the numbers, and the personal information can be easily obtained. 

This type of vulnerability has a proper noun, called IDOR, standing for “Insecure direct object references,” which means insecure direct data access. The reason for the vulnerability is that engineers did not pay attention to access control during development, so that users can access other people’s data easily. 

Some people who read the article until now may think that I provide a simplified example to make the article easy to understand. They think the attacks in real life are not so simple. 

They are half right. Most websites do not have such an obvious loophole, and the attack vector will be more complicated. But the scary thing is that some websites are really that simple, and you can get other people’s information by changing the number.

Taiwan has a website called [HITCON ZeroDay](https://zeroday.hitcon.org/). It is a vulnerability reporting platform maintained by the Association of Hackers in Taiwan. Some people may steal the personal information to sell and engage in illegal activities after discovering the loopholes, while some people find loopholes just to practice their skills and do not want to do bad things. 

Therefore, you can report through this platform. After reporting the vulnerability, the volunteers responsible for maintaining the platform will verify the vulnerability for you. After verification, it will be reported to the responsible manufacturer so that they can fix the vulnerability.

Vulnerabilities on this platform will be announced after they are fixed, or even if the manufacturer does not report the patch, they will also be made public after a while (for example, two months). Therefore, many public loopholes can be found on this platform. You probably don’t want to leave real personal information when registering on the website... 

So, it’s just that easy to change a number on the address bar.

In the future, if you see this kind of number on the address bar, you can try to change it. Maybe you can find IDOR loopholes even if you don’t know coding or programming. 
 
In addition to this kind of vulnerability that only needs to change a number, there is another vulnerability which is very common but requires a little technical ability, called SQL Injection. 

Let’s talk about what SQL is, in simple terms, it is a programming language for querying things in databases. Since it’s a language, there will be fixed syntax. If we use English for example, it will be like:

> Search for “order information”, give me “id is 1”, and sort by “date created” 

The part framed with “” means that it can be changed, while other keywords such as search for and give me are fixed, because the syntax must be fixed before do the coding to analyze it. 

Take the previous online shopping website for example. If the website is https://shop.huli.tw/orders?id=14597, when the website asks the information from the database, the command will be like: 

> Search for “order information”, give me “id is 14597” 

Because the id on the address bar is 14597, this id will be put into the query command. If the id is something else, the query command will be different. 

If my id is not a number, but “id is 1 and the user information”, the query becomes: 

> Search for “order information” and give me “id is 1 and the user information” 

Then the user information of the entire website will be obtained by me. 

The reason why this attack is called SQL injection lies in the injection. The attacker “injects” a piece of text that is executed as part of the instruction, so the attacker can execute any query. 

Compared with IDOR mentioned above, SQL injection is usually more deadly, because not only the order information itself, but also other data will be obtained together. Therefore, in addition to order information, member information and product information may be leaked together.

The defense method is not to use the “give me id is 1 and the user information” input by the user directly as a command, but after some processing, make the entire query become: ‘Give me the id is: “1 and user information”’, since there is no such id, nothing will happen. 

## Personal Information Is Leaked, Then What? 

Earlier we have seen how easy it is to leak personal information from the websites that are not well-defended. 

After the information is leaked, what will be the impact on users? 

The impact that people feel most related should be the fraudulent phone calls. For example, some bookstore or room booking websites call you that they need to refund in installments. To gain your trust, they even can tell which book you bought, which room you booked or your home address and name. 

These are all due to the data leakage, and the scam gang know it clearly. 

In addition to those personal information, there are two other things that will be leaked, your account number and password. 

Maybe you will say, “Isn't it just the account number and password, I'll just change the password on that website and use it later!” 

Things may not be as simple as you think. If you don't use a password manager, I'd take a wild guess that all your passwords are probably the same set. Because if I can’t remember it, I will just use the same set of passwords. 

At this time, if the account number and password are leaked, can hackers use this set of account number and password on other services?
 
They can try to login your Google account, Facebook account, and if you are using the same set of passwords, they could break in. Therefore, it seems like a shopping website being hacked, but it results in your Google and Facebook accounts being hacked as well.

Therefore, sometimes the account is being hacked from a certain website, but the problem might not be that website. Instead, the hacker has obtained your account and password elsewhere, and came here to try it out. 

For website developers, protecting users’ personal information is essential for sure, as well as protecting passwords. Is there any good way to protect passwords? 

Is it encrypted? Encrypt the password with some algorithms, so that the database will store the encrypted results. Even if it is stolen, the hacker will not be able to solve it if there is no decryption method. 

It sounds like the safest way to do it, but there is another problem, that is, the developer of the website will still know how to decrypt it. What if an internal engineer steals it? He knows each user’s passwords, and he can sell those information or use it himself.  

Hmm…it seems like we can do nothing, because in any case, the developer needs to have a way to know what the password for the data inventory is, right? Otherwise, how can I confirm that the account and the password are correct when logging in? 

Furthermore, it should be safe enough, how can it be safer? Is it safe enough that even the developers of the website can't decrypt it and don't know what the password is?

Bingo! That's correct, and that's what it's supposed to be! 

## No One Knows Your Password, Including the Website Itself 

In fact, the website’s database does not store your passwords. 

Or more precisely, your “original password” is not stored, but the result of a certain operation on the password is stored, and most importantly, this operation is irreversible. 

It is faster to give an example directly. Suppose there is a very simple algorithm today, which can convert the password. The conversion method is: “The number is not converted. The English letter is replaced as a to 1, b to 2...z to 26”, By analogy, the certain letter is replaced by certain number, and the uppercase and lowercase letters work the same (assuming that there will be no symbols). 

If the password is abc123, then it becomes 123123 after conversion. 

When the user registers, the website converts the abc123 input by the user into 123123 and stores it in the database. So, the password in the database is 123123, not abc123. 

When the user logs in, we convert the input value with the same logic. If the input is the same, the converted result will be the same, right? We can further know if the password is correct. 

When hackers break in the database, they will get the password of 123123. Then couldn’t hackers infer that it is originally from abc123? No, no, it's not that simple. 

123123, abcabc, 12cab3... After these passwords are converted, aren’t they also 123123? Despite knowing the conversion rules and results, hackers have no way to convert it back to “the only set of passwords.” That’s why this algorithm is so powerful!
 
This conversion is called Hash. After abc123 has been through hashing process, it will become 123123, but from 123123 it cannot be reverted to abc123 since there are other possibilities. 

This is the biggest difference between hash and encryption.

Encryption and decryption are paired. If you can encrypt, you can decrypt. So if you know the ciphertext and the key, you can know the plaintext. But hash is different. You know the algorithm and result of hash, but you can't figure out what the original input is. 

One of the most common applications of this mechanism is the storage of passwords. 

When users registering, we can save the hashed password into the database. When users logging in, we can compare the entered password hashed with the database to know whether the password is correct. Even if the database is stolen, the hacker does not know what the user’s password is because it cannot be reverted. 

That's why when you forget your password, the website won't tell you what the original password is, because the website itself doesn't know! 

So you can't "recover your password", you can only "reset your password", because resetting means you enter a new password, and then the website hashes the new password and stores it in the database, and this new set of passwords will be used when logging in in the future.

Some people may notice that there seems to be a loophole in this storage method. Continuing with the previous example, the data inventory is 123123 and my original password is abc123, so if I use “abcabc”, it will also be 123123 after the hash, so others can also log in? That's not right, it's not my password. 

Two different inputs produce the same set of outputs. This situation is called a hash collision. A collision will definitely happen, but if the algorithm is well designed, the probability of a collision is so small that it can be ignored. 

The conversion rules mentioned above are just for the convenience of examples. The algorithms used in the real world are much more complicated. Even if only one word is different, the results will be very different. Take the SHA256 algorithm as an example:

1. abc123 => 6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090 
2. abc124 => cd7011e7a6b27d44ce22a71a4cdfc2c47d5c67e335319ed7f6ae72cc03d7d63f 


Similar inputs result in entirely different outputs. 

The conversion I used in the previous example is an insecure hash algorithm. Try to avoid using it or avoid designing it yourself. Instead, try to use algorithms designed by cryptographers and experts, such as the SHA256 mentioned above. 

When using these algorithms, you should also pay special attention to whether they are safe, because although some algorithms are also designed by experts, they have been proved to be insecure. For example, it is insecure to store passwords after hashing with MD5. Reference: [Is MD5 considered insecure?](https://security.stackexchange.com/questions/19906/is-md5-considered-insecure)

## So, Is It Okay to Store the Hashed Value? 

Sorry, it's not enough to just store the hashed value of the password. 

Huh, why? Didn't I just say that there is no way to revert the results, so why is it not enough? 

Although there is no way to revert the result, an attacker can use the feature of “the same input, the same output” to build a database first. 

For example, suppose there is a very common password, abc123, and the value after hashing is 6ca13d, then the attacker can convert it first, and then save this conversion in the database. So, the attacker's database may have 1 million most common passwords, with each password and its hashed value. 

As long as 6ca13d is found in the database after the hashing, the attacker can find out that the original password is abc123 by looking up the chart. This is not to use an algorithm to infer the results; instead, it is just to use the existing data to query. 

To defend against this kind of attack, there is one more thing to do called Salting. Yes, it is the salt that comes out of your mind. Usually, it will generate a unique salt for each user, let’s say 5ab3od (in reality, it will be longer, maybe 16 or 32 characters or more), then add my password, abc123, with my salt to become abc1235ab3od. After that, we could use this result to do hash. 

Why do you want to do this? 

Because in the chart prepared by the attacker, the probability of abc1235ab3od occurring is obviously lower than that of abc123, and because the length becomes longer, the difficulty of brute-force attacking becomes higher. As a result, the password becomes more difficult to be attacked. 

## Conclusion

The website won't send me my password when I forget it, because the site itself doesn't know what my password is. While it sounds unlikely, that's actually the case. For security, this is a must. 

To achieve this goal, the most important technical principle behind it is Hash. “The same password will generate the same hash value, but the hash value cannot correspond to the original password” is the secret. 

On the other hand, if you find a website that can retrieve your password, you need to pay more attention. It is possible that the data inventory of the website is not the hash value but your password. In this case, once the database is invaded and the account and password are stolen, the hacker will know your real password and use it to try other services. 

Regarding password management, browsers now can automatically generate passwords for you and memorize your passwords, or you can use ready-made password management software to generate different passwords for different websites. 

Hope this article can help the readers who are new to this field to know some basic concepts, including: 

1. Some websites are much more fragile than you think, and you can get other people’s information by changing the URL. 
2. For websites with poor security, it is not difficult to get the entire database. 
3. When you forget your password, it can only be reset, not retrieved, because the website does not know your password either. 
4. If there is a website that can give you your old password, you must be careful. 

(This post is translated by Lisa)
